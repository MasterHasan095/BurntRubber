import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  if (isInitializing) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
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