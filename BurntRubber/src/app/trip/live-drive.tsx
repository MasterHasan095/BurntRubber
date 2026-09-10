import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useGarageStore } from "../../store/garageStore";
import { useTripStore } from "../../store/tripStore";

export default function LiveDriveScreen() {
  const router = useRouter();
  const { vehicles, fetchVehicles } = useGarageStore();
  const { activeTrip, beginTrip, endTrip, cancelActiveTrip, error } =
    useTripStore();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!activeTrip) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(
        Math.round(
          (Date.now() - new Date(activeTrip.started_at).getTime()) / 1000,
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTrip]);

  const handleStart = async () => {
    if (!selectedVehicleId) return;
    await beginTrip(selectedVehicleId);
  };

  const handleStop = async () => {
    await endTrip();
    router.back();
  };

  const handleCancel = async () => {
    await cancelActiveTrip();
    router.back();
  };

  if (activeTrip) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#888", marginBottom: 8 }}>
          Recording...
        </Text>
        <Text style={{ fontSize: 48, fontWeight: "700", marginBottom: 32 }}>
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </Text>

        {error && <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>}

        <Pressable
          onPress={handleStop}
          style={{
            backgroundColor: "#208AEF",
            paddingVertical: 16,
            paddingHorizontal: 48,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
            Stop Trip
          </Text>
        </Pressable>

        <Pressable onPress={handleCancel}>
          <Text style={{ color: "#888" }}>Discard trip</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 16 }}>
        Select a vehicle
      </Text>

      {vehicles.length === 0 && (
        <Text style={{ color: "#888" }}>
          No vehicles in your garage yet. Add one first.
        </Text>
      )}

      <ScrollView style={{ marginBottom: 16 }}>
        {vehicles.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => setSelectedVehicleId(v.id)}
            style={{
              padding: 14,
              borderWidth: 2,
              borderColor: selectedVehicleId === v.id ? "#208AEF" : "#333",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {v.nickname || `${v.year} ${v.make} ${v.model}`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error && <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>}

      <Pressable
        onPress={handleStart}
        disabled={!selectedVehicleId}
        style={{
          backgroundColor: selectedVehicleId ? "#208AEF" : "#ccc",
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
          Start Trip
        </Text>
      </Pressable>
    </View>
  );
}