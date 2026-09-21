import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { ProgramProvider } from "@/context/ProgramContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import AuthNavigator from "@/navigation/AuthNavigator";
import AppNavigator from "@/navigation/AppNavigator";

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen label="Signing you in…" />;

  return (
    <NavigationContainer>
      {session ? (
        <ProgramProvider>
          <AppNavigator />
        </ProgramProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
