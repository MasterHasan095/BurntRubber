import { Redirect } from "expo-router";
import "../lib/tracking/locationTask"; // registers the background location task

export default function Index() {
  return <Redirect href="/(tabs)/dashboard" />;
}