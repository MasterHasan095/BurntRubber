import { useEffect } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useTripStore } from "../../store/tripStore";
import { useGarageStore } from "../../store/garageStore";

export default function HistoryScreen() {
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

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString();
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
          <View
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#333",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "600", marginBottom: 4 }}>
              {getVehicleLabel(item.vehicle_id)}
            </Text>
            <Text style={{ color: "#888", marginBottom: 2 }}>
              {formatDate(item.started_at)}
            </Text>
            <Text style={{ color: "#888", marginBottom: 2 }}>
              Duration: {formatDuration(item.duration_seconds)}
            </Text>
            <Text style={{ color: "#888", marginBottom: 2 }}>
              Distance: {item.distance_meters.toFixed(0)}m
            </Text>
            <Text style={{ color: "#555", fontSize: 12, marginTop: 4 }}>
              status: {item.status} · id: {item.id.slice(0, 8)}...
            </Text>
          </View>
        )}
      />
    </View>
  );
}