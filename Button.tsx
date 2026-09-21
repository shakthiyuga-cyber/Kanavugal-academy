import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import { colors, radius, spacing, typography } from "@/theme/theme";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface Props extends PressableProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = "primary",
  loading,
  fullWidth,
  disabled,
  style,
  ...rest
}: Props) {
  const variantStyle = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        fullWidth && { alignSelf: "stretch" },
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
        style as any,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color as string} />
      ) : (
        <Text style={[styles.label, variantStyle.text]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  label: {
    ...typography.bodyStrong,
  },
});

const variantStyles: Record<
  Variant,
  { container: any; text: any }
> = {
  primary: {
    container: { backgroundColor: colors.navy },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.gold },
    text: { color: colors.navyDark },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.navy,
    },
    text: { color: colors.navy },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: colors.white },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.navy },
  },
};
