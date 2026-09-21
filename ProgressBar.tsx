import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/theme";

export function ProgressBar({
  value, // 0-100
  color = colors.schoolAccent,
  showLabel = true,
  height = 8,
}: {
  value: number;
  color?: string;
  showLabel?: boolean;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: color, height },
          ]}
        />
      </View>
      {showLabel && <Text style={styles.label}>{Math.round(pct)}% completed</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    borderRadius: radius.pill,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
