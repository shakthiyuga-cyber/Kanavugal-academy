import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { Database } from "@/types/database";

// Values come from app config (see app.json "extra" or, preferably, a .env
// file loaded by babel-plugin-dotenv / expo-env). For local dev, create a
// .env file at the project root:
//
//   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
//
// Expo automatically exposes any EXPO_PUBLIC_* env var to the app at build
// time, so no extra config is required.

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (Constants.expoConfig?.extra as any)?.supabaseUrl ??
  "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (Constants.expoConfig?.extra as any)?.supabaseAnonKey ??
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw in production builds — surface a clear dev-time warning
  // instead, so the rest of the app can still render an explanatory screen.
  console.warn(
    "[Kanavugal Academy] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Create a .env file — see src/lib/supabase.ts for instructions."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage works cross-platform (incl. web, where Supabase falls
    // back to localStorage automatically if we don't override it, but this
    // keeps behavior identical across native + web).
    storage: Platform.OS === "web" ? undefined : (AsyncStorage as any),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
