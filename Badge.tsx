import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/theme";

const TONES = {
  neutral: { bg: "#EEF0F6", fg: colors.textSecondary },
  success: { bg: "#E5F6EC", fg: colors.success },
  warning: { bg: "#FBF1E1", fg: "#8A6414" },
  danger: { bg: "#FBE7E1", fg: colors.danger },
  info: { bg: "#E7EFFD", fg: colors.info },
};

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.tiny,
  },
});
