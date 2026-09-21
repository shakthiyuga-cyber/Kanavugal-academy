import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Enrollment, Program } from "@/types/database";

interface EnrolledProgram extends Program {
  enrollment: Enrollment;
}

interface ProgramContextValue {
  enrolledPrograms: EnrolledProgram[];
  activeProgram: EnrolledProgram | null;
  setActiveProgramKey: (key: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [enrolledPrograms, setEnrolledPrograms] = useState<EnrolledProgram[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user) {
      setEnrolledPrograms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, program:programs(*)")
      .eq("user_id", session.user.id)
      .eq("status", "active");

    if (!error && data) {
      const rows = (data as any[])
        .filter((row) => row.program)
        .map((row) => ({ ...(row.program as Program), enrollment: row as Enrollment }));
      setEnrolledPrograms(rows);
      setActiveKey((prev) => prev ?? rows[0]?.key ?? null);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const activeProgram = enrolledPrograms.find((p) => p.key === activeKey) ?? null;

  return (
    <ProgramContext.Provider
      value={{
        enrolledPrograms,
        activeProgram,
        setActiveProgramKey: setActiveKey,
        loading,
        refresh: load,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function usePrograms() {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error("usePrograms must be used within a ProgramProvider");
  return ctx;
}
