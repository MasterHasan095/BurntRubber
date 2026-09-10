import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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