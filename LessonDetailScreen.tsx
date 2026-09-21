import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View, Linking, Pressable } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import type { Lesson } from "@/types/database";

type Rt = { params: AppStackParamList["LmsLessonDetail"] };

export default function LessonDetailScreen() {
  const route = useRoute() as unknown as Rt;
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single()
      .then(({ data }) => setLesson(data as Lesson))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) return <LoadingScreen />;
  if (!lesson) return null;

  return (
    <AppShell active="LmsSubjects" title={lesson.title}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          {lesson.content_url ? (
            <Pressable onPress={() => Linking.openURL(lesson.content_url!)}>
              <Text style={styles.link}>Open {lesson.content_type} →</Text>
            </Pressable>
          ) : null}
          {lesson.body ? <Text style={styles.body}>{lesson.body}</Text> : null}
          {!lesson.body && !lesson.content_url ? (
            <Text style={styles.muted}>This lesson has no content yet.</Text>
          ) : null}
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" },
  body: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
  link: { ...typography.bodyStrong, color: colors.info, marginBottom: spacing.sm },
  muted: { ...typography.caption, color: colors.textMuted },
});
