import { Redirect, Tabs } from "expo-router";

export default function TabsLayout() {


  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="garage" options={{ title: "Garage" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
