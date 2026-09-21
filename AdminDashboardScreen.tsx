import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/theme/theme";

export default function AdminDashboardScreen() {
  const [counts, setCounts] = useState<{ users: number; students: number; teachers: number; homework: number; quizzes: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: students }, { count: teachers }, { count: homework }, { count: quizzes }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
          supabase.from("homework").select("*", { count: "exact", head: true }),
          supabase.from("quizzes").select("*", { count: "exact", head: true }),
        ]);
      setCounts({
        users: users ?? 0,
        students: students ?? 0,
        teachers: teachers ?? 0,
        homework: homework ?? 0,
        quizzes: quizzes ?? 0,
      });
    })();
  }, []);

  return (
    <AppShell active="AdminDashboard" title="Admin Dashboard">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          <Stat label="Total users" value={counts?.users} />
          <Stat label="Students" value={counts?.students} />
          <Stat label="Teachers" value={counts?.teachers} />
          <Stat label="Homework assigned" value={counts?.homework} />
          <Stat label="Quizzes published" value={counts?.quizzes} />
        </View>
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>What you can manage from here</Text>
          <Text style={styles.body}>
            Use "Manage Subjects" to build out the curriculum (subjects → chapters → lessons) for
            each grade, and "Manage Users" to assign roles, grades/sections and teacher
            assignments. Both are wired to the same database as the student-facing app, so
            changes appear immediately.
          </Text>
        </Card>
      </ScrollView>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { width: 160, alignItems: "center", paddingVertical: spacing.lg },
  statValue: { ...typography.h1, color: colors.navy },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary },
});
