import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { getQuizQuestions } from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { QuizAttempt, QuizQuestion } from "@/types/database";

type Rt = { params: AppStackParamList["LmsQuizResult"] };
type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function QuizResultScreen() {
  const route = useRoute() as unknown as Rt;
  const navigation = useNavigation<Nav>();
  const { attemptId, quizId } = route.params;
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("quiz_attempts").select("*").eq("id", attemptId).single(),
      getQuizQuestions(quizId),
    ]).then(([{ data }, qs]) => {
      setAttempt(data as QuizAttempt);
      setQuestions(qs);
      setLoading(false);
    });
  }, [attemptId, quizId]);

  if (loading) return <LoadingScreen />;
  if (!attempt) return null;

  const answers = (attempt.answers as Record<string, unknown>) || {};
  const attempted = questions.filter((q) => answers[q.id] !== undefined).length;
  const correct = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const pct = attempt.max_score ? Math.round(((attempt.score || 0) / attempt.max_score) * 100) : 0;

  const timeTaken =
    attempt.submitted_at && attempt.started_at
      ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000)
      : null;

  return (
    <AppShell active="LmsQuizList" title="Quiz Result">
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.scoreCard}>
          <Text style={styles.scorePct}>{pct}%</Text>
          <Text style={styles.scoreLabel}>{attempt.score} / {attempt.max_score} marks</Text>
        </Card>

        <View style={styles.statsRow}>
          <Stat label="Attempted" value={`${attempted}/${questions.length}`} />
          <Stat label="Correct" value={String(correct)} />
          <Stat label="Incorrect" value={String(attempted - correct)} />
          {timeTaken !== null && <Stat label="Time" value={`${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`} />}
        </View>

        <Text style={styles.sectionTitle}>Answer review</Text>
        {questions.map((q, i) => {
          const given = answers[q.id];
          const ok = isCorrect(q, given);
          return (
            <Card key={q.id} style={[styles.reviewCard, { borderLeftColor: ok ? colors.success : colors.danger, borderLeftWidth: 4 }]}>
              <Text style={styles.reviewQ}>{i + 1}. {q.question_text}</Text>
              <Text style={styles.reviewLine}>Your answer: {formatAnswer(given)}</Text>
              {!ok && <Text style={styles.reviewLineCorrect}>Correct answer: {formatAnswer(q.correct_answer)}</Text>}
              {q.explanation ? <Text style={styles.reviewExplanation}>{q.explanation}</Text> : null}
            </Card>
          );
        })}

        <Button label="Back to Quizzes" variant="outline" onPress={() => navigation.navigate("LmsQuizList")} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </AppShell>
  );
}

function isCorrect(q: QuizQuestion, given: unknown): boolean {
  if (given === undefined || given === null) return false;
  switch (q.question_type) {
    case "mcq":
    case "true_false":
      return given === q.correct_answer;
    case "multiple_answer": {
      const c = new Set(q.correct_answer as string[]);
      const g = new Set(given as string[]);
      return c.size === g.size && [...c].every((v) => g.has(v));
    }
    case "numerical":
      return Number(given) === Number(q.correct_answer);
    case "fill_blank":
      return String(given).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
    default:
      return false;
  }
}

function formatAnswer(val: unknown): string {
  if (val === undefined || val === null) return "—";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center", gap: spacing.md },
  scoreCard: { alignItems: "center", paddingVertical: spacing.xl },
  scorePct: { fontSize: 44, fontWeight: "800", color: colors.navy },
  scoreLabel: { ...typography.body, color: colors.textSecondary },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  reviewCard: { gap: 4 },
  reviewQ: { ...typography.bodyStrong, color: colors.textPrimary },
  reviewLine: { ...typography.caption, color: colors.textSecondary },
  reviewLineCorrect: { ...typography.caption, color: colors.success },
  reviewExplanation: { ...typography.caption, color: colors.textMuted, fontStyle: "italic" },
});
