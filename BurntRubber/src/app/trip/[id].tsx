import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getTrip, getTripPoints, Trip, TripPoint } from "../../db/trips";
import { useGarageStore } from "../../store/garageStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useTripStore } from "../../store/tripStore";
import { getTripEvents, TripEvent } from "../../db/tripEvents";
import { formatDistance, distanceUnitLabel, formatSpeed, speedUnitLabel } from "../../lib/units";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { vehicles, fetchVehicles } = useGarageStore();
  const { units, loadSettings } = useSettingsStore();
  const { removeTrip } = useTripStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TripEvent[]>([]);

  useEffect(() => {
    fetchVehicles();
    loadSettings();

    (async () => {
      if (!id) return;
      const [t, p, e] = await Promise.all([
        getTrip(id),
        getTripPoints(id),
        getTripEvents(id),
      ]);
      setTrip(t);
      setPoints(p);
      setEvents(e);
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
  const formatDateFull = (isoString: string) =>
    new Date(isoString).toLocaleString();

  const handleDelete = () => {
    Alert.alert(
      "Delete Trip",
      "This will permanently delete this trip and its data. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            await removeTrip(id);
            router.back();
          },
        },
      ],
    );
  };

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
        <MetricCard
          label="Distance"
          value={formatDistance(trip.distance_meters, units)}
          unit={distanceUnitLabel(units)}
        />
        <MetricCard
          label="Duration"
          value={formatDuration(trip.duration_seconds)}
          unit=""
        />
        <MetricCard
          label="Max Speed"
          value={formatSpeed(trip.max_speed_mps, units)}
          unit={speedUnitLabel(units)}
        />
        <MetricCard
          label="Avg Speed"
          value={formatSpeed(trip.avg_speed_mps, units)}
          unit={speedUnitLabel(units)}
        />
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

      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
        Events ({events.length})
      </Text>
      {events.length === 0 ? (
        <Text style={{ color: "#888", marginBottom: 20 }}>
          No notable events detected.
        </Text>
      ) : (
        <View style={{ marginBottom: 20 }}>
          {events.map((event) => (
            <View
              key={event.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderColor: "#222",
              }}
            >
              <Text style={{ fontWeight: "500" }}>
                {eventLabel(event.type)}
              </Text>
              <Text style={{ color: "#888" }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={handleDelete}
        style={{
          borderWidth: 1,
          borderColor: "red",
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
          marginTop: 8,
          marginBottom: 40,
        }}
      >
        <Text style={{ color: "red", fontWeight: "600" }}>Delete Trip</Text>
      </Pressable>
    </ScrollView>
  );
}

function eventLabel(type: string): string {
  switch (type) {
    case "hard_brake":
      return "\ud83d\uded1 Hard Brake";
    case "hard_accel":
      return "\u26a1 Hard Acceleration";
    case "sharp_turn":
      return "\u21a9\ufe0f Sharp Turn";
    default:
      return type;
  }
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
        {unit ? (
          <Text style={{ fontSize: 14, color: "#888" }}> {unit}</Text>
        ) : null}
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