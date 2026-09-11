import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useTripStore } from "../../store/tripStore";
import { useGarageStore } from "../../store/garageStore";
import { useSettingsStore } from "../../store/settingsStore";
import { formatDistance, distanceUnitLabel, formatSpeed, speedUnitLabel } from "../../lib/units";

export default function DashboardScreen() {
  const router = useRouter();
  const { stats, mostRecentTrip, isLoading, fetchDashboardData } =
    useTripStore();
  const { vehicles, fetchVehicles } = useGarageStore();
  const { units, loadSettings } = useSettingsStore();

  useEffect(() => {
    fetchDashboardData();
    fetchVehicles();
    loadSettings();
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };
  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const recentVehicle = mostRecentTrip
    ? vehicles.find((v) => v.id === mostRecentTrip.vehicle_id)
    : null;
  const recentVehicleLabel = recentVehicle
    ? recentVehicle.nickname ||
      `${recentVehicle.year} ${recentVehicle.make} ${recentVehicle.model}`
    : "Unknown vehicle";

  return (
    <ScrollView
      style={{ flex: 1, padding: 20 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchDashboardData} />
      }
    >
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 20 }}>
        Dashboard
      </Text>

      <Pressable
        onPress={() => router.push("/trip/live-drive")}
        style={{
          backgroundColor: "#208AEF",
          paddingVertical: 18,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 18 }}>
          Start Drive
        </Text>
      </Pressable>

      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
        All-Time Stats
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Trips"
          value={String(stats?.totalTrips ?? 0)}
        />
        <StatCard
          label="Total Distance"
          value={formatDistance(stats?.totalDistanceMeters ?? 0, units)}
          unit={distanceUnitLabel(units)}
        />
        <StatCard
          label="Total Drive Time"
          value={formatDuration(stats?.totalDurationSeconds ?? 0)}
        />
        <StatCard
          label="Hard Brakes"
          value={String(stats?.totalHardBrakes ?? 0)}
        />
        <StatCard
          label="Hard Accels"
          value={String(stats?.totalHardAccels ?? 0)}
        />
        <StatCard
          label="Sharp Turns"
          value={String(stats?.totalSharpTurns ?? 0)}
        />
      </View>

      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
        Last Drive
      </Text>
      {mostRecentTrip ? (
        <Pressable
          onPress={() => router.push(`/trip/${mostRecentTrip.id}`)}
          style={{
            borderWidth: 1,
            borderColor: "#333",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>{recentVehicleLabel}</Text>
            <Text style={{ color: "#888" }}>
              {formatDate(mostRecentTrip.started_at)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {formatDistance(mostRecentTrip.distance_meters, units)}
              </Text>
              <Text style={{ color: "#888", fontSize: 12 }}>
                {distanceUnitLabel(units)}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {formatDuration(mostRecentTrip.duration_seconds)}
              </Text>
              <Text style={{ color: "#888", fontSize: 12 }}>duration</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {formatSpeed(mostRecentTrip.max_speed_mps, units)}
              </Text>
              <Text style={{ color: "#888", fontSize: 12 }}>
                max {speedUnitLabel(units)}
              </Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <Text style={{ color: "#888" }}>
          No trips recorded yet. Start a drive to see it here.
        </Text>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View
      style={{
        flexBasis: "31%",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        {value}
        {unit ? (
          <Text style={{ fontSize: 12, color: "#888" }}> {unit}</Text>
        ) : null}
      </Text>
      <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}