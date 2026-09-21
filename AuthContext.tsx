import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppRole, Profile } from "@/types/database";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: AppRole
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);

  const loadProfileAndRoles = useCallback(async (userId: string) => {
    const [{ data: profileData }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileData as Profile) ?? null);
    const roleList = ((roleRows as { role: AppRole }[]) ?? []).map((r) => r.role);
    setRoles(roleList);
    setActiveRoleState((prev) => prev ?? roleList[0] ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfileAndRoles(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfileAndRoles(newSession.user.id);
      } else {
        setProfile(null);
        setRoles([]);
        setActiveRoleState(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfileAndRoles]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, role: AppRole) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      // The DB trigger creates the profile row; we still need to assign the
      // chosen role explicitly (self-serve signup — an admin can change it later).
      if (data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfileAndRoles(session.user.id);
  }, [session, loadProfileAndRoles]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const isStaff = useMemo(
    () => roles.includes("admin") || roles.includes("super_admin"),
    [roles]
  );

  const value: AuthContextValue = {
    session,
    profile,
    roles,
    loading,
    activeRole,
    setActiveRole: setActiveRoleState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    hasRole,
    isStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
