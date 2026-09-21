import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { getQuizzesForSection } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Quiz } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function QuizListScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { studentProfile, loading: profileLoading } = useStudentProfile();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.section_id || !session?.user) {
      setLoading(false);
      return;
    }
    getQuizzesForSection(studentProfile.section_id, session.user.id)
      .then(setQuizzes)
      .finally(() => setLoading(false));
  }, [studentProfile, session]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsQuizList" title="Quizzes">
      <FlatList
        data={quizzes}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={<EmptyState title="No quizzes yet" />}
        renderItem={({ item }) => {
          const attempted = !!item.my_attempt?.submitted_at;
          return (
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{item.subject?.name} · {Math.round(item.timer_seconds / 60)} min</Text>
                {attempted && (
                  <Badge
                    label={`Score: ${item.my_attempt?.score ?? 0}/${item.my_attempt?.max_score ?? 0}`}
                    tone="success"
                  />
                )}
              </View>
              <Button
                label={attempted ? "View result" : "Start"}
                onPress={() =>
                  attempted
                    ? navigation.navigate("LmsQuizResult", { attemptId: item.my_attempt!.id, quizId: item.id })
                    : navigation.navigate("LmsQuizAttempt", { quizId: item.id })
                }
              />
            </Card>
          );
        }}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
});
