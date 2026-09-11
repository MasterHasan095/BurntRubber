import { Alert, Pressable, Text, View } from "react-native";
import { useEffect } from "react";
import { useSettingsStore } from "../../store/settingsStore";
import { getDb } from "../../db";

export default function SettingsScreen() {
  const { units, isLoaded, loadSettings, setUnits } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleResetData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all vehicles, trips, and settings. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            const db = await getDb();
            await db.execAsync(`
              DELETE FROM trip_events;
              DELETE FROM trip_points;
              DELETE FROM trips;
              DELETE FROM vehicles;
              DELETE FROM settings;
            `);
            Alert.alert("Done", "All data has been deleted.");
          },
        },
      ],
    );
  };

  if (!isLoaded) return null;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
        Settings
      </Text>

      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
        Units
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 30 }}>
        <UnitOption
          label="Metric (km, km/h)"
          selected={units === "metric"}
          onPress={() => setUnits("metric")}
        />
        <UnitOption
          label="Imperial (mi, mph)"
          selected={units === "imperial"}
          onPress={() => setUnits("imperial")}
        />
      </View>

      <Pressable
        onPress={handleResetData}
        style={{
          borderWidth: 1,
          borderColor: "red",
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "red", fontWeight: "600" }}>
          Delete All Data
        </Text>
      </Pressable>
    </View>
  );
}

function UnitOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderWidth: 2,
        borderColor: selected ? "#208AEF" : "#333",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: selected ? "600" : "400" }}>{label}</Text>
    </Pressable>
  );
}