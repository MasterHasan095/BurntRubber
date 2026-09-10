import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 24 }}>
        Dashboard
      </Text>

      <Pressable
        onPress={() => router.push("/trip/live-drive")}
        style={{
          backgroundColor: "#208AEF",
          paddingVertical: 18,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
          Start Drive
        </Text>
      </Pressable>
    </View>
  );
}