import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, StyleSheet, Linking, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { getSubjects, getStudyMaterials } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { StudyMaterial, Subject } from "@/types/database";

export default function StudyMaterialsScreen() {
  const { studentProfile, loading: profileLoading } = useStudentProfile();
  const [materials, setMaterials] = useState<(StudyMaterial & { subjectName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile?.grade_id) {
      setLoading(false);
      return;
    }
    (async () => {
      const subjects = await getSubjects(studentProfile.grade_id!);
      const all: (StudyMaterial & { subjectName?: string })[] = [];
      for (const s of subjects) {
        const items = await getStudyMaterials(s.id);
        all.push(...items.map((m) => ({ ...m, subjectName: s.name })));
      }
      setMaterials(all);
      setLoading(false);
    })();
  }, [studentProfile]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsStudyMaterials" title="Study Materials">
      <FlatList
        data={materials}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={<EmptyState title="No study materials yet" subtitle="Your teachers haven't uploaded resources yet." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => Linking.openURL(item.url)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{item.subjectName}</Text>
              </View>
              <Badge label={item.type} />
            </Card>
          </Pressable>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textSecondary },
});
