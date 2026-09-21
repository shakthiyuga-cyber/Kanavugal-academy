import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getQuizQuestions,
  startQuizAttempt,
  submitQuizAttempt,
  gradeQuiz,
} from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Quiz, QuizQuestion } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Rt = { params: AppStackParamList["LmsQuizAttempt"] };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function QuizAttemptScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as unknown as Rt;
  const { quizId } = route.params;
  const { session } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [started, setStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single()
      .then(({ data }) => setQuiz(data as Quiz))
      .finally(() => setLoading(false));
  }, [quizId]);

  const onStart = useCallback(async () => {
    if (!session?.user || !quiz) return;
    const attempt = await startQuizAttempt(quizId, session.user.id);
    const qs = await getQuizQuestions(quizId);
    setAttemptId(attempt.id);
    setQuestions(quiz.shuffle_questions ? shuffle(qs) : qs);
    setAnswers((attempt.answers as Record<string, unknown>) || {});
    const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    setSecondsLeft(Math.max(0, quiz.timer_seconds - elapsed));
    setStarted(true);
  }, [session, quiz, quizId]);

  const onSubmit = useCallback(
    async (auto = false) => {
      if (!attemptId) return;
      setSubmitting(true);
      const { score, maxScore } = gradeQuiz(questions, answers);
      await submitQuizAttempt({ attemptId, answers, score, maxScore, autoSubmitted: auto });
      setSubmitting(false);
      navigation.replace("LmsQuizResult", { attemptId, quizId });
    },
    [attemptId, questions, answers, navigation, quizId]
  );

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          onSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, onSubmit]);

  if (loading) return <LoadingScreen />;
  if (!quiz) return null;

  if (!started) {
    return (
      <AppShell active="LmsQuizList" title={quiz.title}>
        <View style={styles.instructionsWrap}>
          <Card style={{ maxWidth: 520, gap: spacing.sm }}>
            <Text style={styles.h2}>Before you begin</Text>
            <Text style={styles.body}>• You will have {Math.round(quiz.timer_seconds / 60)} minutes to complete this quiz.</Text>
            <Text style={styles.body}>• The quiz will auto-submit when time runs out.</Text>
            <Text style={styles.body}>• You can mark questions for review and revisit them.</Text>
            <Text style={styles.body}>• Once submitted, you'll see your score and a detailed breakdown.</Text>
            <Button label="Start Quiz" onPress={onStart} style={{ marginTop: spacing.md }} />
          </Card>
        </View>
      </AppShell>
    );
  }

  const q = questions[current];
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <AppShell active="LmsQuizList" title={quiz.title}>
      <View style={styles.attemptRoot}>
        <ScrollView contentContainerStyle={styles.questionCol}>
          <View style={styles.timerRow}>
            <Text style={styles.qCounter}>Question {current + 1} of {questions.length}</Text>
            <Text style={[styles.timer, secondsLeft < 60 && { color: colors.danger }]}>
              ⏱ {minutes}:{secs.toString().padStart(2, "0")}
            </Text>
          </View>

          {q && (
            <Card style={{ gap: spacing.md }}>
              <Text style={styles.questionText}>{q.question_text}</Text>
              <QuestionInput
                question={q}
                value={answers[q.id]}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              />
              <View style={styles.actionRow}>
                <Button
                  label="Clear answer"
                  variant="ghost"
                  onPress={() => setAnswers((prev) => { const n = { ...prev }; delete n[q.id]; return n; })}
                />
                <Button
                  label={marked.has(q.id) ? "Unmark" : "Mark for review"}
                  variant="outline"
                  onPress={() =>
                    setMarked((prev) => {
                      const n = new Set(prev);
                      n.has(q.id) ? n.delete(q.id) : n.add(q.id);
                      return n;
                    })
                  }
                />
              </View>
            </Card>
          )}

          <View style={styles.navRow}>
            <Button label="Previous" variant="outline" disabled={current === 0} onPress={() => setCurrent((c) => c - 1)} />
            {current < questions.length - 1 ? (
              <Button label="Save & Next" onPress={() => setCurrent((c) => c + 1)} />
            ) : (
              <Button label="Submit Quiz" onPress={() => onSubmit(false)} loading={submitting} />
            )}
          </View>
        </ScrollView>

        <ScrollView style={styles.gridCol} contentContainerStyle={{ padding: spacing.md }}>
          <Text style={styles.gridTitle}>Question Navigator</Text>
          <View style={styles.grid}>
            {questions.map((question, i) => {
              const answered = answers[question.id] !== undefined;
              const isMarked = marked.has(question.id);
              return (
                <Pressable
                  key={question.id}
                  onPress={() => setCurrent(i)}
                  style={[
                    styles.gridCell,
                    current === i && styles.gridCellActive,
                    answered && styles.gridCellAnswered,
                    isMarked && styles.gridCellMarked,
                  ]}
                >
                  <Text style={styles.gridCellText}>{i + 1}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button label="Submit Quiz" onPress={() => onSubmit(false)} loading={submitting} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </View>
    </AppShell>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  switch (question.question_type) {
    case "mcq":
    case "true_false":
      return (
        <View style={{ gap: spacing.xs }}>
          {question.options.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.option, value === opt.id && styles.optionSelected]}
              onPress={() => onChange(opt.id)}
            >
              <Text style={[styles.optionText, value === opt.id && { color: colors.white }]}>{opt.text}</Text>
            </Pressable>
          ))}
        </View>
      );
    case "multiple_answer": {
      const selected = new Set((value as string[]) || []);
      return (
        <View style={{ gap: spacing.xs }}>
          {question.options.map((opt) => {
            const isSel = selected.has(opt.id);
            return (
              <Pressable
                key={opt.id}
                style={[styles.option, isSel && styles.optionSelected]}
                onPress={() => {
                  const next = new Set(selected);
                  isSel ? next.delete(opt.id) : next.add(opt.id);
                  onChange([...next]);
                }}
              >
                <Text style={[styles.optionText, isSel && { color: colors.white }]}>{opt.text}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    }
    case "numerical":
      return (
        <TextField
          keyboardType="numeric"
          placeholder="Enter numeric answer"
          value={value !== undefined ? String(value) : ""}
          onChangeText={(t) => onChange(t)}
        />
      );
    case "fill_blank":
    case "short_answer":
    default:
      return (
        <TextField
          placeholder="Type your answer"
          value={(value as string) || ""}
          onChangeText={onChange}
          multiline={question.question_type === "short_answer"}
        />
      );
  }
}

const styles = StyleSheet.create({
  instructionsWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  h2: { ...typography.h2, color: colors.navy },
  body: { ...typography.body, color: colors.textSecondary },
  attemptRoot: { flex: 1, flexDirection: "row" },
  questionCol: { flex: 1, padding: spacing.lg, gap: spacing.md, maxWidth: 720 },
  timerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qCounter: { ...typography.bodyStrong, color: colors.textSecondary },
  timer: { ...typography.h3, color: colors.textPrimary },
  questionText: { ...typography.h3, color: colors.textPrimary },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm },
  optionSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  optionText: { ...typography.body, color: colors.textPrimary },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  navRow: { flexDirection: "row", justifyContent: "space-between" },
  gridCol: { width: 220, borderLeftWidth: 1, borderLeftColor: colors.border, backgroundColor: colors.surface },
  gridTitle: { ...typography.bodyStrong, marginBottom: spacing.sm, color: colors.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  gridCell: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  gridCellActive: { borderColor: colors.navy, borderWidth: 2 },
  gridCellAnswered: { backgroundColor: "#E5F6EC" },
  gridCellMarked: { backgroundColor: "#FBF1E1" },
  gridCellText: { ...typography.caption, color: colors.textPrimary },
});
