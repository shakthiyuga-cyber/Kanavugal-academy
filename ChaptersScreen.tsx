import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getChapters } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Chapter } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Rt = { params: AppStackParamList["LmsChapters"] };

export default function ChaptersScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as unknown as Rt;
  const { subjectId, subjectName } = route.params;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChapters(subjectId).then(setChapters).finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsSubjects" title={subjectName}>
      <FlatList
        data={chapters}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={<EmptyState title="No chapters yet" subtitle="Content for this subject hasn't been added yet." />}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => navigation.navigate("LmsLessons", { chapterId: item.id, chapterTitle: item.title })}>
            <Card style={styles.row}>
              <Text style={styles.index}>{index + 1}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </Pressable>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  index: { ...typography.caption, color: colors.textMuted, width: 20 },
  title: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  chevron: { color: colors.textMuted, fontSize: 18 },
});
