import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTripStore } from "../../store/tripStore";
import { useGarageStore } from "../../store/garageStore";
import { useSettingsStore } from "../../store/settingsStore";
import { Trip } from "../../db/trips";
import { formatDistance, distanceUnitLabel, formatSpeed, speedUnitLabel } from "../../lib/units";

export default function HistoryScreen() {
  const router = useRouter();
  const { trips, isLoading, error, fetchTrips, removeTrip } = useTripStore();
  const { vehicles, fetchVehicles } = useGarageStore();
  const { units, loadSettings } = useSettingsStore();
  const [actionSheetTrip, setActionSheetTrip] = useState<Trip | null>(null);

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
    loadSettings();
  }, []);

  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicles.find((v) => v.id === vehicleId);
    if (!v) return "Unknown vehicle";
    return v.nickname || `${v.year} ${v.make} ${v.model}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!actionSheetTrip) return;
    await removeTrip(actionSheetTrip.id);
    setActionSheetTrip(null);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 16 }}>
        History
      </Text>

      {error && <Text style={{ color: "red", marginBottom: 12 }}>{error}</Text>}

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchTrips} />
        }
        ListEmptyComponent={
          <Text style={{ color: "#888" }}>
            No trips yet. Start a drive to see it here.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/trip/${item.id}`)}
            onLongPress={() => setActionSheetTrip(item)}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: "#333",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "600", fontSize: 16 }}>
                {getVehicleLabel(item.vehicle_id)}
              </Text>
              <Text style={{ color: "#888" }}>{formatDate(item.started_at)}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 20 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {formatDistance(item.distance_meters, units)}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>
                  {distanceUnitLabel(units)}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {formatDuration(item.duration_seconds)}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>duration</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {formatSpeed(item.max_speed_mps, units)}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>
                  max {speedUnitLabel(units)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Delete confirmation action sheet */}
      <Modal visible={!!actionSheetTrip} transparent animationType="fade">
        <Pressable
          onPress={() => setActionSheetTrip(null)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              margin: 16,
              overflow: "hidden",
            }}
          >
            <Pressable onPress={handleDelete} style={{ padding: 16 }}>
              <Text style={{ fontSize: 16, color: "red", textAlign: "center" }}>
                Delete Trip
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setActionSheetTrip(null)}
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              margin: 16,
              marginTop: 0,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 16, textAlign: "center", color: "#888" }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}