// Kanavugal Academy — shared design tokens.
// "Learn. Practice. Grow. Achieve."
// One palette, three visual accents (School / Competitive / Montessori) so the
// programs feel distinct while staying visibly part of the same brand.

export const colors = {
  // Brand
  navy: "#0B1F3A",
  navyDark: "#071429",
  gold: "#D9A441",
  white: "#FFFFFF",

  // Neutrals
  bg: "#F6F7FB",
  surface: "#FFFFFF",
  border: "#E4E7EF",
  textPrimary: "#131B2E",
  textSecondary: "#5B6478",
  textMuted: "#9AA2B1",

  // Program accents
  schoolAccent: "#2F6FED", // blue — School LMS
  competitiveAccent: "#E0562B", // orange-red — NEET/JEE (urgency, focus)
  montessoriAccent: "#2FA66A", // green — Montessori (growth, calm)

  // Status
  success: "#2FA66A",
  warning: "#D9A441",
  danger: "#E0562B",
  info: "#2F6FED",

  // Attendance
  present: "#2FA66A",
  absent: "#E0562B",
  late: "#D9A441",
  excused: "#5B6478",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  tiny: { fontSize: 11, fontWeight: "500" as const, lineHeight: 14 },
};

export const shadow = {
  card: {
    shadowColor: "#0B1F3A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

// Breakpoint used everywhere we switch between mobile and laptop/desktop layout.
export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_DESKTOP = 1100;
