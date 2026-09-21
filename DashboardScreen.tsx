import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
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
import { useResponsive } from "@/hooks/useResponsive";
import {
  getHomeworkForSection,
  getQuizzesForSection,
  getTimetableForSection,
} from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Homework, Quiz, TimetableEntry } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function LmsDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { studentProfile, loading: profileLoading } = useStudentProfile();
  const { isDesktop } = useResponsive();

  const [homework, setHomework] = useState<Homework[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [today, setToday] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.section_id || !session?.user) {
      setLoading(false);
      return;
    }
    const dow = new Date().getDay() === 0 ? 7 : new Date().getDay();
    Promise.all([
      getHomeworkForSection(studentProfile.section_id, session.user.id),
      getQuizzesForSection(studentProfile.section_id, session.user.id),
      getTimetableForSection(studentProfile.section_id),
    ])
      .then(([hw, qz, tt]) => {
        setHomework(hw.filter((h) => h.my_submission?.status !== "evaluated").slice(0, 5));
        setQuizzes(qz.filter((q) => !q.my_attempt).slice(0, 3));
        setToday(tt.filter((t) => t.day_of_week === dow));
      })
      .finally(() => setLoading(false));
  }, [studentProfile, session]);

  if (profileLoading || loading) return <LoadingScreen />;

  if (!studentProfile?.section_id) {
    return (
      <AppShell active="LmsDashboard" title="School LMS">
        <EmptyState
          title="No class assigned yet"
          subtitle="Ask your school admin to assign you to a grade and section."
        />
      </AppShell>
    );
  }

  return (
    <AppShell active="LmsDashboard" title="School LMS">
      <ScrollView contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}>
        <View style={{ flex: 1, gap: spacing.md }}>
          <Card>
            <Text style={styles.cardTitle}>Today's Learning</Text>
            {today.length === 0 ? (
              <Text style={styles.muted}>No classes scheduled for today.</Text>
            ) : (
              today.map((t) => (
                <View key={t.id} style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Period {t.period}</Text>
                  <Text style={styles.periodSubject}>{t.subject?.name}</Text>
                  <Text style={styles.periodTime}>
                    {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
                  </Text>
                </View>
              ))
            )}
            <Button
              label="View full timetable"
              variant="ghost"
              onPress={() => navigation.navigate("LmsTimetable")}
              style={{ marginTop: spacing.xs, alignSelf: "flex-start" }}
            />
          </Card>

          <Card>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Pending Homework</Text>
              <Button label="See all" variant="ghost" onPress={() => navigation.navigate("LmsHomeworkList")} />
            </View>
            {homework.length === 0 ? (
              <Text style={styles.muted}>Nothing pending — nice work!</Text>
            ) : (
              homework.map((h) => (
                <View key={h.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{h.title}</Text>
                    <Text style={styles.listSub}>{h.subject?.name} · Due {new Date(h.due_date).toLocaleDateString()}</Text>
                  </View>
                  <Badge
                    label={h.my_submission?.status?.replace("_", " ") || "assigned"}
                    tone={h.my_submission?.status === "submitted" ? "success" : "warning"}
                  />
                </View>
              ))
            )}
          </Card>

          <Card>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Upcoming Quizzes</Text>
              <Button label="See all" variant="ghost" onPress={() => navigation.navigate("LmsQuizList")} />
            </View>
            {quizzes.length === 0 ? (
              <Text style={styles.muted}>No quizzes waiting for you right now.</Text>
            ) : (
              quizzes.map((q) => (
                <View key={q.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{q.title}</Text>
                    <Text style={styles.listSub}>{q.subject?.name}</Text>
                  </View>
                  <Button label="Start" onPress={() => navigation.navigate("LmsQuizAttempt", { quizId: q.id })} />
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={[styles.sideCol, isDesktop && styles.sideColDesktop]}>
          <Card>
            <Text style={styles.cardTitle}>Continue learning</Text>
            <Text style={styles.muted}>Jump back into your subjects.</Text>
            <Button label="My Subjects" variant="outline" onPress={() => navigation.navigate("LmsSubjects")} style={{ marginTop: spacing.sm }} />
          </Card>
          <Card>
            <Text style={styles.cardTitle}>Attendance</Text>
            <Text style={styles.muted}>Check your attendance record.</Text>
            <Button label="View Attendance" variant="outline" onPress={() => navigation.navigate("LmsAttendance")} style={{ marginTop: spacing.sm }} />
          </Card>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  containerDesktop: { flexDirection: "row", alignItems: "flex-start" },
  sideCol: { gap: spacing.md },
  sideColDesktop: { width: 300 },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { ...typography.caption, color: colors.textMuted },
  periodRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  periodLabel: { ...typography.caption, color: colors.textMuted, width: 70 },
  periodSubject: { ...typography.bodyStrong, flex: 1, color: colors.textPrimary },
  periodTime: { ...typography.caption, color: colors.textSecondary },
  listRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  listSub: { ...typography.caption, color: colors.textSecondary },
});
