import React, { useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
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
import { createQuiz } from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { QuestionType, QuizOption } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface DraftQuestion {
  question_type: QuestionType;
  question_text: string;
  options: QuizOption[];
  correct_answer: unknown;
  explanation: string;
  marks: number;
  sort_order: number;
}

function emptyQuestion(order: number): DraftQuestion {
  return {
    question_type: "mcq",
    question_text: "",
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    correct_answer: "a",
    explanation: "",
    marks: 1,
    sort_order: order,
  };
}

const TYPE_LABELS: { key: QuestionType; label: string }[] = [
  { key: "mcq", label: "MCQ" },
  { key: "multiple_answer", label: "Multiple answer" },
  { key: "true_false", label: "True / False" },
  { key: "numerical", label: "Numerical" },
  { key: "fill_blank", label: "Fill in the blank" },
  { key: "short_answer", label: "Short answer" },
];

export default function CreateQuizScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { assignments, loading } = useTeacherAssignments();
  const [assignmentIdx, setAssignmentIdx] = useState(0);
  const [title, setTitle] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("10");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion(0)]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return <LoadingScreen />;
  if (assignments.length === 0) {
    return (
      <AppShell active="TeacherCreateQuiz" title="Create Quiz">
        <EmptyState title="No classes assigned" />
      </AppShell>
    );
  }

  const assignment = assignments[assignmentIdx];

  const updateQuestion = (idx: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, oi) => (oi === optIdx ? { ...o, text } : o)) }
          : q
      )
    );
  };

  const onSubmit = async () => {
    if (!session?.user || !title) return;
    setSaving(true);
    try {
      await createQuiz(
        {
          teacher_id: session.user.id,
          subject_id: assignment.subject_id,
          grade_id: assignment.section.grade.id,
          section_id: assignment.section_id!,
          title,
          timer_seconds: (Number(timerMinutes) || 10) * 60,
          shuffle_questions: true,
          is_published: true,
        },
        questions.map((q) => ({
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.question_type === "mcq" || q.question_type === "multiple_answer" || q.question_type === "true_false" ? q.options : [],
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          marks: q.marks,
          sort_order: q.sort_order,
        })) as any
      );
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AppShell active="TeacherCreateQuiz" title="Create Quiz">
        <View style={styles.centered}>
          <Text style={styles.heading}>Quiz published ✅</Text>
          <Button label="Create another" onPress={() => { setDone(false); setTitle(""); setQuestions([emptyQuestion(0)]); }} />
          <Button label="Back to dashboard" variant="ghost" onPress={() => navigation.navigate("ProgramHub")} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell active="TeacherCreateQuiz" title="Create Quiz">
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
          <TextField label="Quiz title" value={title} onChangeText={setTitle} placeholder="Weekly Quiz — Chapter 4" />
          <TextField label="Timer (minutes)" keyboardType="numeric" value={timerMinutes} onChangeText={setTimerMinutes} />
        </Card>

        {questions.map((q, qIdx) => (
          <Card key={qIdx} style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <View style={styles.qHeader}>
              <Text style={styles.qLabel}>Question {qIdx + 1}</Text>
              {questions.length > 1 && (
                <Button label="Remove" variant="ghost" onPress={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))} />
              )}
            </View>

            <View style={styles.chipRow}>
              {TYPE_LABELS.map((t) => (
                <Button
                  key={t.key}
                  label={t.label}
                  variant={q.question_type === t.key ? "primary" : "outline"}
                  onPress={() =>
                    updateQuestion(qIdx, {
                      question_type: t.key,
                      options: t.key === "true_false" ? [{ id: "true", text: "True" }, { id: "false", text: "False" }] : q.options,
                      correct_answer: t.key === "true_false" ? "true" : t.key === "multiple_answer" ? [] : "",
                    })
                  }
                  style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                />
              ))}
            </View>

            <TextField label="Question text" value={q.question_text} onChangeText={(t) => updateQuestion(qIdx, { question_text: t })} />

            {(q.question_type === "mcq" || q.question_type === "multiple_answer") &&
              q.options.map((opt, oIdx) => (
                <TextField
                  key={opt.id}
                  label={`Option ${opt.id.toUpperCase()}`}
                  value={opt.text}
                  onChangeText={(t) => updateOption(qIdx, oIdx, t)}
                />
              ))}

            {q.question_type === "mcq" && (
              <>
                <Text style={styles.label}>Correct option</Text>
                <View style={styles.chipRow}>
                  {q.options.map((opt) => (
                    <Button
                      key={opt.id}
                      label={opt.id.toUpperCase()}
                      variant={q.correct_answer === opt.id ? "primary" : "outline"}
                      onPress={() => updateQuestion(qIdx, { correct_answer: opt.id })}
                      style={{ marginRight: spacing.xs }}
                    />
                  ))}
                </View>
              </>
            )}

            {q.question_type === "multiple_answer" && (
              <>
                <Text style={styles.label}>Correct options</Text>
                <View style={styles.chipRow}>
                  {q.options.map((opt) => {
                    const selected = (q.correct_answer as string[]).includes(opt.id);
                    return (
                      <Button
                        key={opt.id}
                        label={opt.id.toUpperCase()}
                        variant={selected ? "primary" : "outline"}
                        onPress={() => {
                          const curr = new Set(q.correct_answer as string[]);
                          selected ? curr.delete(opt.id) : curr.add(opt.id);
                          updateQuestion(qIdx, { correct_answer: [...curr] });
                        }}
                        style={{ marginRight: spacing.xs }}
                      />
                    );
                  })}
                </View>
              </>
            )}

            {q.question_type === "true_false" && (
              <View style={styles.chipRow}>
                {["true", "false"].map((v) => (
                  <Button
                    key={v}
                    label={v}
                    variant={q.correct_answer === v ? "primary" : "outline"}
                    onPress={() => updateQuestion(qIdx, { correct_answer: v })}
                    style={{ marginRight: spacing.xs }}
                  />
                ))}
              </View>
            )}

            {(q.question_type === "numerical" || q.question_type === "fill_blank") && (
              <TextField
                label="Correct answer"
                value={String(q.correct_answer ?? "")}
                onChangeText={(t) => updateQuestion(qIdx, { correct_answer: t })}
              />
            )}

            <TextField label="Explanation (shown after submit)" value={q.explanation} onChangeText={(t) => updateQuestion(qIdx, { explanation: t })} />
            <TextField label="Marks" keyboardType="numeric" value={String(q.marks)} onChangeText={(t) => updateQuestion(qIdx, { marks: Number(t) || 1 })} />
          </Card>
        ))}

        <Button
          label="+ Add question"
          variant="outline"
          onPress={() => setQuestions((prev) => [...prev, emptyQuestion(prev.length)])}
          style={{ marginTop: spacing.md }}
        />
        <Button label="Publish Quiz" onPress={onSubmit} loading={saving} fullWidth style={{ marginTop: spacing.md }} />
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center", paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  heading: { ...typography.h2, color: colors.navy },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  qHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qLabel: { ...typography.h3, color: colors.textPrimary },
});
