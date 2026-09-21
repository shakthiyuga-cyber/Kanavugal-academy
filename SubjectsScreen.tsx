import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useResponsive } from "@/hooks/useResponsive";
import { getSubjects } from "@/api/lms";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Subject } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function SubjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { studentProfile, loading: profileLoading } = useStudentProfile();
  const { isDesktop } = useResponsive();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.grade_id) {
      setLoading(false);
      return;
    }
    getSubjects(studentProfile.grade_id)
      .then(setSubjects)
      .finally(() => setLoading(false));
  }, [studentProfile]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsSubjects" title="My Learning">
      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        numColumns={isDesktop ? 3 : 2}
        key={isDesktop ? "d3" : "m2"}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        columnWrapperStyle={{ gap: spacing.md }}
        ListEmptyComponent={<EmptyState title="No subjects yet" subtitle="Your admin hasn't configured subjects for your grade yet." />}
        renderItem={({ item }) => (
          <Pressable
            style={{ flex: 1 }}
            onPress={() => navigation.navigate("LmsChapters", { subjectId: item.id, subjectName: item.name })}
          >
            <Card style={styles.subjectCard}>
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
              <Text style={styles.subjectName}>{item.name}</Text>
            </Card>
          </Pressable>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  subjectCard: { alignItems: "flex-start", gap: spacing.sm, minHeight: 96, justifyContent: "flex-end" },
  swatch: { width: 32, height: 32, borderRadius: radius.sm },
  subjectName: { ...typography.bodyStrong, color: colors.textPrimary },
});
