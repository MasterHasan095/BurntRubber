import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getTrip, getTripPoints, Trip, TripPoint } from "../../db/trips";
import { useGarageStore } from "../../store/garageStore";

const MPS_TO_MPH = 2.23694;

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, fetchVehicles } = useGarageStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    (async () => {
      if (!id) return;
      const [t, p] = await Promise.all([getTrip(id), getTripPoints(id)]);
      setTrip(t);
      setPoints(p);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Trip not found.</Text>
      </View>
    );
  }

  const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
  const vehicleLabel = vehicle
    ? vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Unknown vehicle";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const formatDistance = (meters: number) => (meters / 1609.34).toFixed(2);
  const formatSpeed = (mps: number | null) =>
    mps != null ? (mps * MPS_TO_MPH).toFixed(1) : "--";
  const formatDateFull = (isoString: string) =>
    new Date(isoString).toLocaleString();

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 4 }}>
        {vehicleLabel}
      </Text>
      <Text style={{ color: "#888", marginBottom: 20 }}>
        {formatDateFull(trip.started_at)}
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard label="Distance" value={formatDistance(trip.distance_meters)} unit="mi" />
        <MetricCard label="Duration" value={formatDuration(trip.duration_seconds)} unit="" />
        <MetricCard label="Max Speed" value={formatSpeed(trip.max_speed_mps)} unit="mph" />
        <MetricCard label="Avg Speed" value={formatSpeed(trip.avg_speed_mps)} unit="mph" />
      </View>

      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
        Trip Info
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        }}
      >
        <InfoRow label="Status" value={trip.status} />
        <InfoRow label="Started" value={formatDateFull(trip.started_at)} />
        <InfoRow
          label="Ended"
          value={trip.ended_at ? formatDateFull(trip.ended_at) : "--"}
        />
        <InfoRow label="GPS points recorded" value={String(points.length)} />
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View
      style={{
        flexBasis: "47%",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>
        {value}
        {unit ? <Text style={{ fontSize: 14, color: "#888" }}> {unit}</Text> : null}
      </Text>
      <Text style={{ color: "#888", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: "#888" }}>{label}</Text>
      <Text style={{ fontWeight: "500" }}>{value}</Text>
    </View>
  );
}