import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, StyleSheet, View, Pressable } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/theme/theme";
import type { Chapter, Grade, Program, Subject } from "@/types/database";

export default function ManageSubjectsScreen() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [chaptersBySubject, setChaptersBySubject] = useState<Record<string, Chapter[]>>({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [schoolProgram, setSchoolProgram] = useState<Program | null>(null);

  useEffect(() => {
    (async () => {
      const { data: program } = await supabase.from("programs").select("*").eq("key", "school_lms").single();
      setSchoolProgram(program as Program);
      const { data: gradeRows } = await supabase
        .from("grades")
        .select("*")
        .eq("program_id", (program as Program).id)
        .order("level");
      setGrades((gradeRows as Grade[]) ?? []);
      setGradeId((gradeRows as Grade[])?.[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const loadSubjects = useCallback(async (gId: string) => {
    const { data } = await supabase.from("subjects").select("*").eq("grade_id", gId).order("name");
    setSubjects((data as Subject[]) ?? []);
  }, []);

  useEffect(() => {
    if (gradeId) loadSubjects(gradeId);
  }, [gradeId, loadSubjects]);

  const loadChapters = async (subjectId: string) => {
    const { data } = await supabase.from("chapters").select("*").eq("subject_id", subjectId).order("sort_order");
    setChaptersBySubject((prev) => ({ ...prev, [subjectId]: (data as Chapter[]) ?? [] }));
  };

  const addSubject = async () => {
    if (!newSubjectName || !gradeId || !schoolProgram) return;
    await supabase.from("subjects").insert({ program_id: schoolProgram.id, grade_id: gradeId, name: newSubjectName });
    setNewSubjectName("");
    loadSubjects(gradeId);
  };

  const addChapter = async (subjectId: string) => {
    if (!newChapterTitle) return;
    const existing = chaptersBySubject[subjectId] || [];
    await supabase.from("chapters").insert({ subject_id: subjectId, title: newChapterTitle, sort_order: existing.length });
    setNewChapterTitle("");
    loadChapters(subjectId);
  };

  if (loading) return <LoadingScreen />;

  return (
    <AppShell active="AdminManageSubjects" title="Manage Subjects">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Grade</Text>
        <View style={styles.chipRow}>
          {grades.map((g) => (
            <Button
              key={g.id}
              label={g.name}
              variant={g.id === gradeId ? "primary" : "outline"}
              onPress={() => setGradeId(g.id)}
              style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
            />
          ))}
        </View>

        <Card style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <TextField label="Add a subject" value={newSubjectName} onChangeText={setNewSubjectName} placeholder="e.g. Computer Science" />
          </View>
          <Button label="Add" onPress={addSubject} style={{ marginBottom: spacing.md }} />
        </Card>

        {subjects.map((s) => (
          <Card key={s.id} style={{ marginTop: spacing.sm }}>
            <Pressable
              onPress={() => {
                const next = expandedSubject === s.id ? null : s.id;
                setExpandedSubject(next);
                if (next) loadChapters(s.id);
              }}
              style={styles.subjectHeader}
            >
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <Text style={styles.subjectName}>{s.name}</Text>
              <Text style={styles.chevron}>{expandedSubject === s.id ? "▲" : "▼"}</Text>
            </Pressable>

            {expandedSubject === s.id && (
              <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                {(chaptersBySubject[s.id] || []).map((c) => (
                  <Text key={c.id} style={styles.chapterRow}>• {c.title}</Text>
                ))}
                <View style={styles.addChapterRow}>
                  <View style={{ flex: 1 }}>
                    <TextField placeholder="New chapter title" value={newChapterTitle} onChangeText={setNewChapterTitle} />
                  </View>
                  <Button label="Add chapter" variant="outline" onPress={() => addChapter(s.id)} />
                </View>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  subjectName: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  chevron: { color: colors.textMuted },
  chapterRow: { ...typography.body, color: colors.textPrimary },
  addChapterRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end", marginTop: spacing.xs },
});
