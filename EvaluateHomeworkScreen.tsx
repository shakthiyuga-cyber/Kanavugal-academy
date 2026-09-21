import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { evaluateHomework } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";

type Rt = { params: AppStackParamList["TeacherEvaluateHomework"] };

export default function EvaluateHomeworkScreen() {
  const route = useRoute() as unknown as Rt;
  const { session } = useAuth();
  const { homeworkId } = route.params;
  const [homework, setHomework] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { marks: string; feedback: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: hw }, { data: subs }] = await Promise.all([
      supabase.from("homework").select("*, subject:subjects(*)").eq("id", homeworkId).single(),
      supabase
        .from("homework_submissions")
        .select("*, student:profiles(full_name)")
        .eq("homework_id", homeworkId),
    ]);
    setHomework(hw);
    const rows = (subs as any[]) ?? [];
    setSubmissions(rows);
    setDrafts(
      Object.fromEntries(
        rows.map((s) => [s.id, { marks: s.marks_awarded?.toString() ?? "", feedback: s.feedback ?? "" }])
      )
    );
    setLoading(false);
  }, [homeworkId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (submissionId: string) => {
    if (!session?.user) return;
    setSavingId(submissionId);
    try {
      await evaluateHomework({
        submissionId,
        marksAwarded: Number(drafts[submissionId]?.marks) || 0,
        feedback: drafts[submissionId]?.feedback,
        evaluatorId: session.user.id,
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <AppShell active="TeacherCreateHomework" title={homework ? `Evaluate: ${homework.title}` : "Evaluate"}>
      <ScrollView contentContainerStyle={styles.container}>
        {submissions.length === 0 ? (
          <EmptyState title="No submissions yet" />
        ) : (
          submissions.map((s) => (
            <Card key={s.id} style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={styles.headerRow}>
                <Text style={styles.studentName}>{s.student?.full_name}</Text>
                <Badge label={s.status} tone={s.status === "evaluated" ? "success" : "warning"} />
              </View>
              {s.content_text ? <Text style={styles.body}>{s.content_text}</Text> : <Text style={styles.muted}>No text answer submitted.</Text>}
              <TextField
                label="Marks"
                keyboardType="numeric"
                value={drafts[s.id]?.marks || ""}
                onChangeText={(t) => setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: t } }))}
              />
              <TextField
                label="Feedback"
                value={drafts[s.id]?.feedback || ""}
                onChangeText={(t) => setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], feedback: t } }))}
                multiline
              />
              <Button label="Save evaluation" onPress={() => onSave(s.id)} loading={savingId === s.id} />
            </Card>
          ))
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  studentName: { ...typography.bodyStrong, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary },
  muted: { ...typography.caption, color: colors.textMuted },
});
