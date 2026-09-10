import { Redirect, Tabs } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function TabsLayout() {

    const { user } = useAuthStore();
  

    if (!user) {
      return <Redirect href="/(auth)/login" />;
    }
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="garage" options={{ title: "Garage" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
