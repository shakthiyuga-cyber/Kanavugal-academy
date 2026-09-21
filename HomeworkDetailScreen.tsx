import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { submitHomework } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Homework, HomeworkSubmission, Subject } from "@/types/database";

type Rt = { params: AppStackParamList["LmsHomeworkDetail"] };

export default function HomeworkDetailScreen() {
  const route = useRoute() as unknown as Rt;
  const { session } = useAuth();
  const { homeworkId } = route.params;

  const [homework, setHomework] = useState<(Homework & { subject: Subject }) | null>(null);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const [{ data: hw }, { data: sub }] = await Promise.all([
      supabase.from("homework").select("*, subject:subjects(*)").eq("id", homeworkId).single(),
      supabase
        .from("homework_submissions")
        .select("*")
        .eq("homework_id", homeworkId)
        .eq("student_id", session.user.id)
        .maybeSingle(),
    ]);
    setHomework(hw as any);
    setSubmission(sub as HomeworkSubmission | null);
    setText((sub as HomeworkSubmission | null)?.content_text || "");
    setAttachments((sub as HomeworkSubmission | null)?.attachments || []);
    setLoading(false);
  }, [homeworkId, session]);

  useEffect(() => {
    load();
  }, [load]);

  const pickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    // NOTE: this stores a local reference only. Wire this up to
    // `supabase.storage.from('homework-attachments').upload(...)` once you've
    // created that storage bucket, then store the returned public/signed URL.
    setAttachments((prev) => [...prev, { name: asset.name, url: asset.uri }]);
  };

  const onSubmit = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const result = await submitHomework({
        homeworkId,
        studentId: session.user.id,
        contentText: text,
        attachments,
      });
      setSubmission(result);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!homework) return null;

  const isEvaluated = submission?.status === "evaluated";
  const isLocked = isEvaluated;

  return (
    <AppShell active="LmsHomeworkList" title={homework.title}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ gap: spacing.xs }}>
          <View style={styles.headerRow}>
            <Badge label={homework.subject?.name} tone="info" />
            <Text style={styles.due}>Due {new Date(homework.due_date).toLocaleString()}</Text>
          </View>
          {homework.description ? <Text style={styles.body}>{homework.description}</Text> : null}
          {homework.instructions ? (
            <>
              <Text style={styles.label}>Instructions</Text>
              <Text style={styles.body}>{homework.instructions}</Text>
            </>
          ) : null}
          {homework.max_marks ? (
            <Text style={styles.muted}>Max marks: {homework.max_marks}</Text>
          ) : null}
        </Card>

        <Card style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={styles.sectionTitle}>Your submission</Text>

          {isEvaluated && (
            <View style={styles.evalBox}>
              <Text style={styles.evalScore}>
                Marks: {submission?.marks_awarded ?? "—"} / {homework.max_marks ?? "—"}
              </Text>
              {submission?.feedback ? <Text style={styles.body}>{submission.feedback}</Text> : null}
            </View>
          )}

          <TextField
            label="Answer"
            multiline
            numberOfLines={6}
            editable={!isLocked}
            value={text}
            onChangeText={setText}
            style={{ minHeight: 120, textAlignVertical: "top" }}
            placeholder="Type your answer here…"
          />

          {attachments.map((a, i) => (
            <Text key={i} style={styles.attachment}>📎 {a.name}</Text>
          ))}

          {!isLocked && (
            <>
              <Button label="Add attachment" variant="outline" onPress={pickAttachment} />
              <Button
                label={submission ? "Update submission" : "Submit homework"}
                onPress={onSubmit}
                loading={saving}
              />
            </>
          )}
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center", gap: spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  due: { ...typography.caption, color: colors.textSecondary },
  body: { ...typography.body, color: colors.textPrimary },
  label: { ...typography.bodyStrong, marginTop: spacing.sm, color: colors.textPrimary },
  muted: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  evalBox: { backgroundColor: "#E5F6EC", borderRadius: 10, padding: spacing.sm, gap: 4 },
  evalScore: { ...typography.bodyStrong, color: colors.success },
  attachment: { ...typography.caption, color: colors.textSecondary },
});
