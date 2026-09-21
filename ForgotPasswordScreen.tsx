import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, spacing, typography } from "@/theme/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset your password</Text>
      {sent ? (
        <Text style={styles.body}>
          If an account exists for {email}, a reset link has been sent.
        </Text>
      ) : (
        <>
          <Text style={styles.body}>
            Enter the email on your account and we'll send a reset link.
          </Text>
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button label="Send reset link" onPress={onSubmit} loading={loading} fullWidth />
        </>
      )}
      <Button label="Back to login" variant="ghost" onPress={() => navigation.replace("Login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, maxWidth: 420, width: "100%", alignSelf: "center", justifyContent: "center", gap: spacing.md },
  heading: { ...typography.h2, color: colors.navy },
  body: { ...typography.body, color: colors.textSecondary },
  errorText: { color: colors.danger, ...typography.caption },
});
