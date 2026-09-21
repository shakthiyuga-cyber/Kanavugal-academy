import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { usePrograms } from "@/context/ProgramContext";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { AppStackParamList } from "@/navigation/types";

export default function ProgramHubScreen() {
  const { profile } = useAuth();
  const { enrolledPrograms, setActiveProgramKey, loading } = usePrograms();
  const { isDesktop } = useResponsive();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const goToProgram = (key: string) => {
    setActiveProgramKey(key);
    if (key === "school_lms") navigation.navigate("LmsDashboard");
    // NEET/JEE and Montessori dashboards are future programs (spec §51) —
    // the hub still lists them once enrolled, ready to wire up.
  };

  return (
    <AppShell active="ProgramHub" title={undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋</Text>
        <Text style={styles.sub}>Here's what's happening across your programs.</Text>

        {loading ? null : enrolledPrograms.length === 0 ? (
          <Card style={{ marginTop: spacing.lg }}>
            <EmptyState
              title="No programs yet"
              subtitle="Once you're enrolled in a program, it will show up here."
            />
          </Card>
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {enrolledPrograms.map((p) => (
              <Card key={p.key} style={[styles.programCard, isDesktop && styles.programCardDesktop]}>
                <View style={[styles.accentBar, { backgroundColor: p.accent_color }]} />
                <Text style={styles.programName}>{p.name}</Text>
                <Text style={styles.programDesc}>{p.description}</Text>
                <ProgressBar value={0} color={p.accent_color} showLabel={false} />
                <Button
                  label={p.key === "school_lms" ? "Continue" : "Open"}
                  variant="outline"
                  onPress={() => goToProgram(p.key)}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.xs },
  welcome: { ...typography.h1, color: colors.navy },
  sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  grid: { gap: spacing.md },
  gridDesktop: { flexDirection: "row", flexWrap: "wrap" },
  programCard: { gap: spacing.sm },
  programCardDesktop: { width: 320 },
  accentBar: { height: 4, borderRadius: radius.pill, width: 48, marginBottom: spacing.xs },
  programName: { ...typography.h3, color: colors.textPrimary },
  programDesc: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
});
