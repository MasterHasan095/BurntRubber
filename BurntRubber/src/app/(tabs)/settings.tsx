import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function Settings() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Settings — TODO</Text>
      <Pressable onPress={logout} style={{ marginTop: 20 }}>
        <Text style={{ color: "#d33" }}>Log out</Text>
      </Pressable>
    </View>
  );
}
