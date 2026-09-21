import { useWindowDimensions } from "react-native";
import { BREAKPOINT_DESKTOP, BREAKPOINT_TABLET } from "@/theme/theme";

/**
 * Central place every screen uses to decide mobile-vs-laptop layout.
 * isDesktop -> show sidebar nav, multi-column grids
 * isTablet  -> medium layout
 * else      -> phone layout, bottom tab nav
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT_DESKTOP;
  const isTablet = width >= BREAKPOINT_TABLET;
  return { width, isDesktop, isTablet, isMobile: !isTablet };
}
