import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppNotification } from "@/types/database";

export default function NotificationsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems((data as AppNotification[]) ?? []);
    setRefreshing(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  return (
    <AppShell active="Notifications" title="Notifications">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title="You're all caught up" subtitle="New homework, quizzes and announcements will show up here." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => markRead(item.id)} style={[styles.item, !item.is_read && styles.itemUnread]}>
            {!item.is_read && <View style={styles.dot} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  itemUnread: { backgroundColor: "#F3F7FF" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info, marginTop: 6 },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  body: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  time: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
});
