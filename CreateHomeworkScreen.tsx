import React, { useState } from "react";
import { ScrollView, Text, StyleSheet, View, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { createHomework } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function CreateHomeworkScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { assignments, loading } = useTeacherAssignments();
  const [assignmentIdx, setAssignmentIdx] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState(""); // ISO string, e.g. 2026-10-01T18:00
  const [maxMarks, setMaxMarks] = useState("10");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return <LoadingScreen />;

  if (assignments.length === 0) {
    return (
      <AppShell active="TeacherCreateHomework" title="Assign Homework">
        <EmptyState title="No classes assigned" subtitle="Ask an admin to assign you to a grade, section and subject." />
      </AppShell>
    );
  }

  const assignment = assignments[assignmentIdx];

  const onSubmit = async () => {
    if (!session?.user || !title || !dueDate) return;
    setSaving(true);
    try {
      await createHomework({
        teacher_id: session.user.id,
        subject_id: assignment.subject_id,
        grade_id: assignment.section.grade.id,
        section_id: assignment.section_id!,
        title,
        description,
        instructions,
        due_date: new Date(dueDate).toISOString(),
        max_marks: Number(maxMarks) || undefined,
        submission_type: "any",
      });
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AppShell active="TeacherCreateHomework" title="Assign Homework">
        <View style={styles.centered}>
          <Text style={styles.heading}>Homework assigned ✅</Text>
          <Button label="Assign another" onPress={() => { setDone(false); setTitle(""); setDescription(""); setInstructions(""); }} />
          <Button label="Back to dashboard" variant="ghost" onPress={() => navigation.navigate("ProgramHub")} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell active="TeacherCreateHomework" title="Assign Homework">
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.chipRow}>
            {assignments.map((a, i) => (
              <Button
                key={a.id}
                label={`${a.section.grade.name} ${a.section.name} · ${a.subject.name}`}
                variant={i === assignmentIdx ? "primary" : "outline"}
                onPress={() => setAssignmentIdx(i)}
                style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
              />
            ))}
          </View>

          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Chapter 4 exercise" />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
          <TextField label="Instructions" value={instructions} onChangeText={setInstructions} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
          <TextField
            label="Due date & time"
            placeholder={Platform.OS === "web" ? "YYYY-MM-DDTHH:MM (e.g. 2026-10-05T18:00)" : "YYYY-MM-DDTHH:MM"}
            value={dueDate}
            onChangeText={setDueDate}
          />
          <TextField label="Max marks" keyboardType="numeric" value={maxMarks} onChangeText={setMaxMarks} />

          <Button label="Assign Homework" onPress={onSubmit} loading={saving} fullWidth />
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  heading: { ...typography.h2, color: colors.navy },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
});
