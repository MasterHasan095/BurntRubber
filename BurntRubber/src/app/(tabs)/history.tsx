import { useEffect } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTripStore } from "../../store/tripStore";
import { useGarageStore } from "../../store/garageStore";

const MPS_TO_MPH = 2.23694;

export default function HistoryScreen() {
  const router = useRouter();
  const { trips, isLoading, error, fetchTrips } = useTripStore();
  const { vehicles, fetchVehicles } = useGarageStore();

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
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

  const formatDistance = (meters: number) => (meters / 1609.34).toFixed(1);
  const formatSpeed = (mps: number | null) =>
    mps != null ? (mps * MPS_TO_MPH).toFixed(0) : "--";

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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
                  {formatDistance(item.distance_meters)}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>miles</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {formatDuration(item.duration_seconds)}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>duration</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {formatSpeed(item.max_speed_mps)}
                </Text>
                <Text style={{ color: "#888", fontSize: 12 }}>max mph</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}