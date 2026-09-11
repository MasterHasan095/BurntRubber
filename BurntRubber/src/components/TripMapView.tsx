import { useMemo } from "react";
import { View } from "react-native";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { TripPoint } from "../db/trips";
import { TripEvent } from "../db/tripEvents";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  points: TripPoint[];
  events: TripEvent[];
  height?: number;
};

export default function TripMapView({ points, events, height = 260 }: Props) {
  const routeGeoJson = useMemo(() => {
    if (points.length < 2) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: points.map((p) => [p.longitude, p.latitude]),
      },
      properties: {},
    };
  }, [points]);

  const eventsGeoJson = useMemo(() => {
    const validEvents = events.filter(
      (e) => e.latitude != null && e.longitude != null,
    );
    return {
      type: "FeatureCollection" as const,
      features: validEvents.map((e) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [e.longitude as number, e.latitude as number],
        },
        properties: { type: e.type },
      })),
    };
  }, [events]);

  const bounds = useMemo(() => {
    if (points.length === 0) return null;
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLon = points[0].longitude;
    let maxLon = points[0].longitude;

    for (const p of points) {
      minLat = Math.min(minLat, p.latitude);
      maxLat = Math.max(maxLat, p.latitude);
      minLon = Math.min(minLon, p.longitude);
      maxLon = Math.max(maxLon, p.longitude);
    }

    // LngLatBounds format: [west, south, east, north]
    return [minLon, minLat, maxLon, maxLat] as [
      number,
      number,
      number,
      number,
    ];
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        height,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <Map style={{ flex: 1 }} mapStyle={MAP_STYLE_URL}>
        {bounds && (
          <Camera
            initialViewState={{
              bounds,
              padding: { top: 40, right: 40, bottom: 40, left: 40 },
            }}
          />
        )}

        {routeGeoJson && (
          <GeoJSONSource id="routeSource" data={routeGeoJson}>
            <Layer
              id="routeLine"
              type="line"
              paint={{
                lineColor: "#208AEF",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </GeoJSONSource>
        )}

        {eventsGeoJson.features.length > 0 && (
          <GeoJSONSource id="eventsSource" data={eventsGeoJson}>
            <Layer
              id="eventCircles"
              type="circle"
              paint={{
                circleRadius: 6,
                circleColor: [
                  "match",
                  ["get", "type"],
                  "hard_brake",
                  "#EF4444",
                  "hard_accel",
                  "#F59E0B",
                  "sharp_turn",
                  "#A855F7",
                  "#888888",
                ],
                circleStrokeWidth: 2,
                circleStrokeColor: "#fff",
              }}
            />
          </GeoJSONSource>
        )}
      </Map>
    </View>
  );
}