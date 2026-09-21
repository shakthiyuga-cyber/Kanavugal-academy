import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View, Pressable } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { getSectionRoster, markAttendanceBulk } from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AttendanceStatus } from "@/types/database";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: colors.present,
  absent: colors.absent,
  late: colors.late,
  excused: colors.excused,
};

export default function MarkAttendanceScreen() {
  const { session } = useAuth();
  const { assignments, loading } = useTeacherAssignments();
  const [assignmentIdx, setAssignmentIdx] = useState(0);
  const [roster, setRoster] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sectionId = assignments[assignmentIdx]?.section_id;

  useEffect(() => {
    if (!sectionId) return;
    setLoadingRoster(true);
    getSectionRoster(sectionId)
      .then((rows) => {
        setRoster(rows);
        setStatusMap(Object.fromEntries(rows.map((r) => [r.user_id, "present" as AttendanceStatus])));
      })
      .finally(() => setLoadingRoster(false));
  }, [sectionId]);

  if (loading) return <LoadingScreen />;
  if (assignments.length === 0) {
    return (
      <AppShell active="TeacherMarkAttendance" title="Mark Attendance">
        <EmptyState title="No classes assigned" />
      </AppShell>
    );
  }

  const assignment = assignments[assignmentIdx];
  const today = new Date().toISOString().slice(0, 10);

  const onSave = async () => {
    setSaving(true);
    try {
      await markAttendanceBulk(
        roster.map((r) => ({
          student_id: r.user_id,
          grade_id: assignment.section.grade.id,
          section_id: assignment.section_id!,
          date: today,
          status: statusMap[r.user_id] || "present",
          marked_by: session?.user.id ?? null,
          remarks: null,
        }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell active="TeacherMarkAttendance" title="Mark Attendance">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Class</Text>
        <View style={styles.chipRow}>
          {assignments.map((a, i) => (
            <Button
              key={a.id}
              label={`${a.section.grade.name} ${a.section.name}`}
              variant={i === assignmentIdx ? "primary" : "outline"}
              onPress={() => setAssignmentIdx(i)}
              style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
            />
          ))}
        </View>
        <Text style={styles.dateLabel}>Date: {today}</Text>

        {loadingRoster ? (
          <LoadingScreen />
        ) : (
          roster.map((r) => (
            <Card key={r.user_id} style={styles.rosterRow}>
              <Text style={styles.studentName}>{r.profile?.full_name} {r.roll_number ? `(#${r.roll_number})` : ""}</Text>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatusMap((prev) => ({ ...prev, [r.user_id]: s }))}
                    style={[
                      styles.statusChip,
                      statusMap[r.user_id] === s && { backgroundColor: STATUS_COLOR[s], borderColor: STATUS_COLOR[s] },
                    ]}
                  >
                    <Text style={[styles.statusChipText, statusMap[r.user_id] === s && { color: colors.white }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))
        )}

        {roster.length > 0 && (
          <Button label={saved ? "Saved ✓" : "Save Attendance"} onPress={onSave} loading={saving} fullWidth style={{ marginTop: spacing.md }} />
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center", gap: spacing.sm },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  dateLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  rosterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  studentName: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  statusRow: { flexDirection: "row", gap: spacing.xs },
  statusChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  statusChipText: { ...typography.tiny, color: colors.textSecondary, textTransform: "capitalize" },
});
