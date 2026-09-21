import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, typography } from "@/theme/theme";

export default function ProfileScreen() {
  const { profile, roles, signOut } = useAuth();

  return (
    <AppShell active="Profile" title="My Profile">
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || "?").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.full_name}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <View style={styles.roleRow}>
              {roles.map((r) => (
                <Badge key={r} label={r.replace("_", " ")} tone="info" />
              ))}
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Contact details</Text>
          <Field label="Phone" value={profile?.phone || "Not set"} />
          <Field label="Date of birth" value={profile?.date_of_birth || "Not set"} />
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.placeholder}>
            Badges and certificates you earn across all programs will appear here.
          </Text>
        </Card>

        <Button
          label="Sign out"
          variant="danger"
          onPress={signOut}
          style={{ marginTop: spacing.lg, alignSelf: "flex-start" }}
        />
      </ScrollView>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center" },
  headerCard: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: "700" },
  name: { ...typography.h3, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  roleRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  sectionTitle: { ...typography.bodyStrong, marginBottom: spacing.sm, color: colors.textPrimary },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textSecondary },
  fieldValue: { ...typography.body, color: colors.textPrimary },
  placeholder: { ...typography.caption, color: colors.textMuted },
});
