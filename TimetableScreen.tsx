import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { getTimetableForSection } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { TimetableEntry } from "@/types/database";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetableScreen() {
  const { studentProfile, loading: profileLoading } = useStudentProfile();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.section_id) {
      setLoading(false);
      return;
    }
    getTimetableForSection(studentProfile.section_id).then(setEntries).finally(() => setLoading(false));
  }, [studentProfile]);

  const byDay = useMemo(() => {
    const map: Record<number, TimetableEntry[]> = {};
    entries.forEach((e) => {
      map[e.day_of_week] = map[e.day_of_week] || [];
      map[e.day_of_week].push(e);
    });
    return map;
  }, [entries]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsTimetable" title="Timetable">
      <ScrollView contentContainerStyle={styles.container}>
        {entries.length === 0 ? (
          <EmptyState title="No timetable published yet" />
        ) : (
          DAYS.map((day, idx) => {
            const dayEntries = (byDay[idx + 1] || []).sort((a, b) => a.period - b.period);
            if (dayEntries.length === 0) return null;
            return (
              <Card key={day} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.dayTitle}>{day}</Text>
                {dayEntries.map((e) => (
                  <View key={e.id} style={styles.entryRow}>
                    <Text style={styles.period}>P{e.period}</Text>
                    <Text style={styles.subject}>{e.subject?.name}</Text>
                    <Text style={styles.time}>{e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}</Text>
                    {e.room ? <Text style={styles.room}>{e.room}</Text> : null}
                  </View>
                ))}
              </Card>
            );
          })
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" },
  dayTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  entryRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  period: { ...typography.caption, color: colors.textMuted, width: 30 },
  subject: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  time: { ...typography.caption, color: colors.textSecondary },
  room: { ...typography.caption, color: colors.textMuted },
});
