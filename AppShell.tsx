import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, radius, spacing, typography } from "@/theme/theme";
import type { AppStackParamList } from "@/navigation/types";
import { ProgramSwitcher } from "@/components/layout/ProgramSwitcher";

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface NavItem {
  key: keyof AppStackParamList;
  label: string;
  icon: string; // simple text/emoji glyph — swap for an icon set in production
  roles?: Array<"student" | "parent" | "teacher" | "trainer" | "admin" | "super_admin" | "trainee">;
}

// Desktop sidebar — full list (spec §44).
const SIDEBAR_ITEMS: NavItem[] = [
  { key: "ProgramHub", label: "Dashboard", icon: "⌂" },
  { key: "LmsSubjects", label: "My Learning", icon: "📘" },
  { key: "LmsHomeworkList", label: "Homework", icon: "📝" },
  { key: "LmsQuizList", label: "Quizzes", icon: "❓" },
  { key: "LmsAttendance", label: "Attendance", icon: "📅" },
  { key: "LmsTimetable", label: "Timetable", icon: "🗓" },
  { key: "LmsStudyMaterials", label: "Study Materials", icon: "📚" },
  { key: "Notifications", label: "Notifications", icon: "🔔" },
  { key: "Profile", label: "Profile", icon: "👤" },
];

const TEACHER_ITEMS: NavItem[] = [
  { key: "TeacherCreateHomework", label: "Assign Homework", icon: "✏️" },
  { key: "TeacherCreateQuiz", label: "Create Quiz", icon: "🧩" },
  { key: "TeacherMarkAttendance", label: "Mark Attendance", icon: "✅" },
];

const ADMIN_ITEMS: NavItem[] = [
  { key: "AdminDashboard", label: "Admin Dashboard", icon: "🛠" },
  { key: "AdminManageSubjects", label: "Manage Subjects", icon: "📂" },
  { key: "AdminManageUsers", label: "Manage Users", icon: "👥" },
];

// Mobile bottom nav — the fixed 7-item set from spec §38.
const MOBILE_ITEMS: NavItem[] = [
  { key: "ProgramHub", label: "Home", icon: "⌂" },
  { key: "LmsSubjects", label: "Learn", icon: "📘" },
  { key: "LmsQuizList", label: "Tests", icon: "❓" },
  { key: "LmsAttendance", label: "Progress", icon: "📈" },
  { key: "Profile", label: "Profile", icon: "👤" },
];

export function AppShell({
  children,
  active,
  title,
}: {
  children: React.ReactNode;
  active?: keyof AppStackParamList;
  title?: string;
}) {
  const navigation = useNavigation<Nav>();
  const { isDesktop, isMobile } = useResponsive();
  const { profile, roles, isStaff, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const canTeach = roles.includes("teacher") || roles.includes("trainer");

  return (
    <View style={styles.root}>
      {isDesktop && (
        <View style={styles.sidebar}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>KA</Text>
            </View>
            <Text style={styles.brandName}>Kanavugal{"\n"}Academy</Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <SidebarSection items={SIDEBAR_ITEMS} active={active} onNavigate={navigation.navigate as any} />
            {canTeach && (
              <>
                <Text style={styles.sectionLabel}>Teaching</Text>
                <SidebarSection items={TEACHER_ITEMS} active={active} onNavigate={navigation.navigate as any} />
              </>
            )}
            {isStaff && (
              <>
                <Text style={styles.sectionLabel}>Administration</Text>
                <SidebarSection items={ADMIN_ITEMS} active={active} onNavigate={navigation.navigate as any} />
              </>
            )}
          </ScrollView>

          <Pressable style={styles.signOutRow} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.mainCol}>
        <View style={[styles.topBar, { paddingTop: isDesktop ? spacing.md : insets.top + spacing.sm }]}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={styles.topTitle}>{title}</Text> : <ProgramSwitcher />}
          </View>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={styles.iconBtn}>
            <Text style={styles.iconGlyph}>🔔</Text>
          </Pressable>
          <Pressable onPress={() => setMenuOpen((v) => !v)} style={styles.avatarBtn}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || "?").slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
          {menuOpen && (
            <View style={styles.profileMenu}>
              <Pressable
                style={styles.profileMenuItem}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("Profile");
                }}
              >
                <Text style={styles.profileMenuText}>My Profile</Text>
              </Pressable>
              <Pressable
                style={styles.profileMenuItem}
                onPress={() => {
                  setMenuOpen(false);
                  signOut();
                }}
              >
                <Text style={[styles.profileMenuText, { color: colors.danger }]}>Sign out</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>{children}</View>

        {isMobile && (
          <View style={[styles.bottomTabs, { paddingBottom: insets.bottom || spacing.sm }]}>
            {MOBILE_ITEMS.map((item) => {
              const isActive = active === item.key;
              return (
                <Pressable
                  key={item.key}
                  style={styles.tabItem}
                  onPress={() => navigation.navigate(item.key as any)}
                >
                  <Text style={[styles.tabIcon, isActive && { opacity: 1 }]}>{item.icon}</Text>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function SidebarSection({
  items,
  active,
  onNavigate,
}: {
  items: NavItem[];
  active?: keyof AppStackParamList;
  onNavigate: (key: keyof AppStackParamList) => void;
}) {
  return (
    <View>
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <Pressable
            key={item.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onNavigate(item.key)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SIDEBAR_WIDTH = 248;

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: colors.bg },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.navy,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  logoCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.navyDark, fontWeight: "700" },
  brandName: { color: colors.white, ...typography.bodyStrong },
  sectionLabel: { color: "rgba(255,255,255,0.5)", ...typography.tiny, marginTop: spacing.md, marginBottom: spacing.xs, marginLeft: spacing.sm, textTransform: "uppercase" },
  navItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10, paddingHorizontal: spacing.sm, borderRadius: radius.sm, marginBottom: 2 },
  navItemActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  navLabel: { color: "rgba(255,255,255,0.75)", ...typography.body },
  navLabelActive: { color: colors.white, fontWeight: "600" },
  signOutRow: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  signOutText: { color: "rgba(255,255,255,0.6)", ...typography.caption },

  mainCol: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    zIndex: 20,
  },
  topTitle: { ...typography.h3, color: colors.textPrimary },
  iconBtn: { padding: spacing.xs },
  iconGlyph: { fontSize: 18 },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "700" },
  profileMenu: {
    position: "absolute",
    top: 50,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    minWidth: 160,
    zIndex: 30,
  },
  profileMenuItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  profileMenuText: { ...typography.body, color: colors.textPrimary },

  bottomTabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  tabItem: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 4 },
  tabIcon: { fontSize: 18, opacity: 0.5 },
  tabLabel: { ...typography.tiny, color: colors.textMuted },
  tabLabelActive: { color: colors.navy, fontWeight: "700" },
});
