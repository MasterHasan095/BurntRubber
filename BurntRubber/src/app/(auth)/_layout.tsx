import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function AuthLayout() {
  const { user } = useAuthStore();

  if (user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}