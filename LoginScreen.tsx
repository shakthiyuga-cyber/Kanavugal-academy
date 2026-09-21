import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, spacing, typography } from "@/theme/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.brandBlock}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>KA</Text>
          </View>
          <Text style={styles.brandName}>Kanavugal Academy</Text>
          <Text style={styles.tagline}>Learn. Practice. Grow. Achieve.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Welcome back</Text>
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button label="Log in" onPress={onSubmit} loading={loading} fullWidth />

          <View style={styles.row}>
            <Button
              label="Forgot password?"
              variant="ghost"
              onPress={() => navigation.navigate("ForgotPassword")}
            />
            <Button
              label="Create account"
              variant="ghost"
              onPress={() => navigation.navigate("Signup")}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.xl,
  },
  brandBlock: { alignItems: "center", gap: spacing.xs },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  logoText: { color: colors.gold, fontSize: 22, fontWeight: "700" },
  brandName: { ...typography.h2, color: colors.navy },
  tagline: { ...typography.caption, color: colors.textSecondary },
  form: { width: "100%", maxWidth: 400, gap: spacing.sm },
  heading: { ...typography.h3, marginBottom: spacing.sm, color: colors.textPrimary },
  errorText: { color: colors.danger, ...typography.caption, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
});
