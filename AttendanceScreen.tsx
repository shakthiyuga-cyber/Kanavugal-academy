import React, { useEffect, useState, useMemo } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getAttendanceForStudent } from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AttendanceRecord, AttendanceStatus } from "@/types/database";

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: colors.present,
  absent: colors.absent,
  late: colors.late,
  excused: colors.excused,
};

export default function AttendanceScreen() {
  const { session } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    getAttendanceForStudent(session.user.id).then(setRecords).finally(() => setLoading(false));
  }, [session]);

  const summary = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { total, present, pct };
  }, [records]);

  if (loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsAttendance" title="Attendance">
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryPct}>{summary.pct}%</Text>
          <Text style={styles.summaryLabel}>
            Present {summary.present} of {summary.total} recorded days (last 90 days)
          </Text>
        </Card>

        {records.length === 0 ? (
          <EmptyState title="No attendance recorded yet" />
        ) : (
          records.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.date}>{new Date(r.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</Text>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[r.status] }]}>
                <Text style={styles.statusText}>{r.status}</Text>
              </View>
              {r.remarks ? <Text style={styles.remarks}>{r.remarks}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center", gap: spacing.sm },
  summaryCard: { alignItems: "center", paddingVertical: spacing.lg, marginBottom: spacing.sm },
  summaryPct: { fontSize: 36, fontWeight: "800", color: colors.navy },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  date: { ...typography.body, color: colors.textPrimary, flex: 1 },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  statusText: { color: colors.white, ...typography.tiny, textTransform: "capitalize" },
  remarks: { ...typography.caption, color: colors.textMuted },
});
