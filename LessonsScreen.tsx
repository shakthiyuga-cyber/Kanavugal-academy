import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getLessons } from "@/api/lms";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Lesson } from "@/types/database";

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Rt = { params: AppStackParamList["LmsLessons"] };

const CONTENT_ICON: Record<string, string> = {
  video: "▶",
  notes: "📄",
  document: "📁",
  audio: "🎧",
  presentation: "📊",
};

export default function LessonsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as unknown as Rt;
  const { chapterId, chapterTitle } = route.params;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessons(chapterId).then(setLessons).finally(() => setLoading(false));
  }, [chapterId]);

  if (loading) return <LoadingScreen />;

  return (
    <AppShell active="LmsSubjects" title={chapterTitle}>
      <FlatList
        data={lessons}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: "100%", alignSelf: "center" }}
        ListEmptyComponent={<EmptyState title="No lessons yet" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("LmsLessonDetail", { lessonId: item.id })}>
            <Card style={styles.row}>
              <Text style={styles.icon}>{CONTENT_ICON[item.content_type] || "📄"}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Badge label={item.content_type} />
            </Card>
          </Pressable>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { fontSize: 18, width: 24, textAlign: "center" },
  title: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
});
