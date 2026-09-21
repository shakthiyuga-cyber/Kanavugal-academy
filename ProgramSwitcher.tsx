import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { usePrograms } from "@/context/ProgramContext";
import { colors, radius, spacing, typography } from "@/theme/theme";

export function ProgramSwitcher() {
  const { enrolledPrograms, activeProgram, setActiveProgramKey } = usePrograms();
  const [open, setOpen] = useState(false);

  if (!activeProgram) {
    return <Text style={styles.title}>Kanavugal Academy</Text>;
  }

  return (
    <View>
      <Pressable style={styles.trigger} onPress={() => setOpen((v) => !v)}>
        <View style={[styles.dot, { backgroundColor: activeProgram.accent_color }]} />
        <Text style={styles.triggerText}>{activeProgram.name}</Text>
        <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {open && (
        <View style={styles.menu}>
          {enrolledPrograms.map((p) => (
            <Pressable
              key={p.key}
              style={styles.menuItem}
              onPress={() => {
                setActiveProgramKey(p.key);
                setOpen(false);
              }}
            >
              <View style={[styles.dot, { backgroundColor: p.accent_color }]} />
              <Text style={styles.menuItemText}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.textPrimary },
  trigger: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  triggerText: { ...typography.h3, color: colors.textPrimary },
  chevron: { fontSize: 10, color: colors.textMuted, marginLeft: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  menu: {
    position: "absolute",
    top: 34,
    left: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 220,
    paddingVertical: spacing.xs,
    zIndex: 30,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  menuItemText: { ...typography.body, color: colors.textPrimary },
});
