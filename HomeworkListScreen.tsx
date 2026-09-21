import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { getHomeworkForSection } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Homework } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  assigned: "warning",
  submitted: "info",
  late: "danger",
  evaluated: "success",
  returned: "warning",
  resubmission_required: "danger",
};

export default function HomeworkListScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { studentProfile, loading: profileLoading } = useStudentProfile();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.section_id || !session?.user) {
      setLoading(false);
      return;
    }
    getHomeworkForSection(studentProfile.section_id, session.user.id)
      .then(setHomework)
      .finally(() => setLoading(false));
  }, [studentProfile, session]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsHomeworkList" title="Homework">
      <FlatList
        data={homework}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={<EmptyState title="No homework assigned" />}
        renderItem={({ item }) => {
          const status = item.my_submission?.status || "assigned";
          return (
            <Pressable onPress={() => navigation.navigate("LmsHomeworkDetail", { homeworkId: item.id })}>
              <Card style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.sub}>
                    {item.subject?.name} · Due {new Date(item.due_date).toLocaleDateString()}
                  </Text>
                </View>
                <Badge label={status.replace("_", " ")} tone={STATUS_TONE[status]} />
              </Card>
            </Pressable>
          );
        }}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textSecondary },
});
