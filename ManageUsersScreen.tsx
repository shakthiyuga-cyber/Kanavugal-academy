import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { TextField } from "@/components/ui/TextField";
import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppRole, Grade, Section } from "@/types/database";

const ROLES: AppRole[] = ["super_admin", "admin", "teacher", "trainer", "student", "trainee", "parent"];

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  roles: AppRole[];
}

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [gradesById, setGradesById] = useState<Record<string, Grade>>({});
  const [sectionsByGrade, setSectionsByGrade] = useState<Record<string, Section[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    const { data: roleRows } = await supabase.from("user_roles").select("user_id, role");
    const rolesByUser: Record<string, AppRole[]> = {};
    (roleRows as any[] | null)?.forEach((r) => {
      rolesByUser[r.user_id] = rolesByUser[r.user_id] || [];
      rolesByUser[r.user_id].push(r.role);
    });
    setUsers(
      ((profiles as any[]) ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        roles: rolesByUser[p.id] || [],
      }))
    );

    const { data: gradeRows } = await supabase.from("grades").select("*");
    const gradeMap: Record<string, Grade> = {};
    (gradeRows as Grade[] | null)?.forEach((g) => (gradeMap[g.id] = g));
    setGradesById(gradeMap);

    const { data: sectionRows } = await supabase.from("sections").select("*");
    const byGrade: Record<string, Section[]> = {};
    (sectionRows as Section[] | null)?.forEach((s) => {
      byGrade[s.grade_id] = byGrade[s.grade_id] || [];
      byGrade[s.grade_id].push(s);
    });
    setSectionsByGrade(byGrade);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRole = async (userId: string, role: AppRole, has: boolean) => {
    if (has) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role });
    }
    load();
  };

  const assignToSection = async (userId: string, sectionId: string, gradeId: string) => {
    await supabase.from("student_profiles").upsert(
      { user_id: userId, grade_id: gradeId, section_id: sectionId },
      { onConflict: "user_id" }
    );
    load();
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <AppShell active="AdminManageUsers" title="Manage Users">
      <ScrollView contentContainerStyle={styles.container}>
        <TextField placeholder="Search by name or email…" value={search} onChangeText={setSearch} />

        {filtered.map((u) => (
          <Card key={u.id} style={{ marginBottom: spacing.sm, gap: spacing.xs }}>
            <Text style={styles.name}>{u.full_name || "(no name)"}</Text>
            <Text style={styles.email}>{u.email}</Text>

            <Text style={styles.label}>Roles</Text>
            <View style={styles.chipRow}>
              {ROLES.map((r) => {
                const has = u.roles.includes(r);
                return (
                  <Button
                    key={r}
                    label={r.replace("_", " ")}
                    variant={has ? "primary" : "outline"}
                    onPress={() => toggleRole(u.id, r, has)}
                    style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                  />
                );
              })}
            </View>

            {u.roles.includes("student") && (
              <>
                <Text style={styles.label}>Assign to section</Text>
                <View style={styles.chipRow}>
                  {Object.values(gradesById)
                    .sort((a, b) => a.level - b.level)
                    .flatMap((g) =>
                      (sectionsByGrade[g.id] || []).map((s) => (
                        <Button
                          key={s.id}
                          label={`${g.name} ${s.name}`}
                          variant="outline"
                          onPress={() => assignToSection(u.id, s.id, g.id)}
                          style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                        />
                      ))
                    )}
                </View>
              </>
            )}
          </Card>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 760, width: "100%", alignSelf: "center", gap: spacing.sm },
  name: { ...typography.bodyStrong, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary },
  label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
});
