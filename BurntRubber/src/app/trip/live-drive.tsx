import { useEffect, useState, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useGarageStore } from "../../store/garageStore";
import { useTripStore } from "../../store/tripStore";
import { haversineDistance } from "../../lib/tracking/geo";

const MPS_TO_MPH = 2.23694;

export default function LiveDriveScreen() {
  const router = useRouter();
  const { vehicles, fetchVehicles } = useGarageStore();
  const { activeTrip, beginTrip, endTrip, cancelActiveTrip, error } =
    useTripStore();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [elapsed, setElapsed] = useState(0);
  const [currentSpeedMps, setCurrentSpeedMps] = useState(0);
  const [maxSpeedMps, setMaxSpeedMps] = useState(0);
  const [liveDistanceMeters, setLiveDistanceMeters] = useState(0);

  const lastDisplayPoint = useRef<{ lat: number; lon: number } | null>(null);
  const displaySubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Timer
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

  // Live speed/distance watcher — display only, does not write to DB
  useEffect(() => {
    if (!activeTrip) {
      displaySubscription.current?.remove();
      displaySubscription.current = null;
      lastDisplayPoint.current = null;
      setCurrentSpeedMps(0);
      setMaxSpeedMps(0);
      setLiveDistanceMeters(0);
      return;
    }

    let cancelled = false;

    (async () => {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          if (cancelled) return;

          const speed = location.coords.speed ?? 0;
          const safeSpeed = speed >= 0 ? speed : 0;

          setCurrentSpeedMps(safeSpeed);
          setMaxSpeedMps((prev) => Math.max(prev, safeSpeed));

          const { latitude, longitude } = location.coords;
          if (lastDisplayPoint.current) {
            const segment = haversineDistance(
              lastDisplayPoint.current.lat,
              lastDisplayPoint.current.lon,
              latitude,
              longitude,
            );
            setLiveDistanceMeters((prev) => prev + segment);
          }
          lastDisplayPoint.current = { lat: latitude, lon: longitude };
        },
      );
      if (!cancelled) {
        displaySubscription.current = sub;
      } else {
        sub.remove();
      }
    })();

    return () => {
      cancelled = true;
      displaySubscription.current?.remove();
      displaySubscription.current = null;
    };
  }, [activeTrip?.id]);

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

  const formatSpeed = (mps: number) => (mps * MPS_TO_MPH).toFixed(0);
  const formatDistance = (meters: number) => (meters / 1609.34).toFixed(2);

  if (activeTrip) {
    return (
      <View
        style={{ flex: 1, padding: 24, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ fontSize: 16, color: "#888", marginBottom: 8 }}>
          Recording...
        </Text>
        <Text style={{ fontSize: 40, fontWeight: "700", marginBottom: 8 }}>
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            width: "100%",
            marginVertical: 24,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 36, fontWeight: "700" }}>
              {formatSpeed(currentSpeedMps)}
            </Text>
            <Text style={{ color: "#888" }}>mph</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 36, fontWeight: "700" }}>
              {formatDistance(liveDistanceMeters)}
            </Text>
            <Text style={{ color: "#888" }}>miles</Text>
          </View>
        </View>

        <Text style={{ color: "#888", marginBottom: 24 }}>
          Max speed: {formatSpeed(maxSpeedMps)} mph
        </Text>

        {error && (
          <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>
        )}

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

      {error && (
        <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>
      )}

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