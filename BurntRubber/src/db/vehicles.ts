import * as Crypto from "expo-crypto";
import { getDb } from "./index";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname: string | null;
  created_at: string;
};

export async function listVehicles(): Promise<Vehicle[]> {
  const db = await getDb();
  return db.getAllAsync<Vehicle>(
    "SELECT * FROM vehicles ORDER BY created_at DESC",
  );
}

export async function addVehicle(input: {
  make: string;
  model: string;
  year: number;
  nickname?: string | null;
}): Promise<Vehicle> {
  const db = await getDb();
  const id = Crypto.randomUUID();

  await db.runAsync(
    "INSERT INTO vehicles (id, make, model, year, nickname) VALUES (?, ?, ?, ?, ?)",
    id,
    input.make,
    input.model,
    input.year,
    input.nickname ?? null,
  );

  const vehicle = await db.getFirstAsync<Vehicle>(
    "SELECT * FROM vehicles WHERE id = ?",
    id,
  );
  if (!vehicle) throw new Error("Failed to fetch newly created vehicle");
  return vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM vehicles WHERE id = ?", id);
}