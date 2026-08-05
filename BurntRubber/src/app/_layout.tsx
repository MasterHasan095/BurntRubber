import { Redirect, SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  if (isInitializing) {
    // Splash screen is still showing, nothing to render yet
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? <Stack.Screen name="(auth)" /> : <Stack.Screen name="(tabs)" />}
      <Stack.Screen
        name="trip/[id]"
        options={{ headerShown: true, title: "Trip" }}
      />
      <Stack.Screen
        name="trip/live-drive"
        options={{ headerShown: true, title: "Live Drive" }}
      />
    </Stack>
  );
}

// Guards any deep-link/direct navigation into a protected or auth route
// that doesn't match the current auth state.
export function useAuthGuard(requireAuth: boolean) {
  const { user, isInitializing } = useAuthStore();

  if (isInitializing) return null;

  if (requireAuth && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!requireAuth && user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  return null;
}
