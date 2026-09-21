import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, spacing, typography } from "@/theme/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import type { AppRole } from "@/types/database";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

const ROLE_OPTIONS: { key: AppRole; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "parent", label: "Parent" },
  { key: "teacher", label: "Teacher" },
  { key: "trainee", label: "Montessori Trainee" },
];

export default function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!fullName || !email || !password) {
      setError("Fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, fullName, role);
    setLoading(false);
    if (signUpError) setError(signUpError);
    else setDone(true);
  };

  if (done) {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.body}>
          We've sent a confirmation link to {email}. Confirm your address, then log in.
        </Text>
        <Button label="Back to login" onPress={() => navigation.replace("Login")} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>
        One account gives you access to every Kanavugal Academy program you're enrolled in.
      </Text>

      <View style={styles.form}>
        <TextField label="Full name" value={fullName} onChangeText={setFullName} />
        <TextField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />

        <Text style={styles.label}>I am a…</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              label={opt.label}
              variant={role === opt.key ? "primary" : "outline"}
              onPress={() => setRole(opt.key)}
              style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label="Sign up" onPress={onSubmit} loading={loading} fullWidth />
        <Button label="Already have an account? Log in" variant="ghost" onPress={() => navigation.replace("Login")} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, maxWidth: 480, width: "100%", alignSelf: "center", gap: spacing.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  heading: { ...typography.h2, color: colors.navy },
  subheading: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  form: { gap: spacing.sm },
  label: { ...typography.bodyStrong, marginTop: spacing.sm },
  roleRow: { flexDirection: "row", flexWrap: "wrap" },
  errorText: { color: colors.danger, ...typography.caption },
});
