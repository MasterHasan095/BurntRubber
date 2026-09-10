import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useGarageStore } from "../../store/garageStore";
import { Vehicle } from "../../db/vehicles";

export default function GarageScreen() {
  const {
    vehicles,
    isLoading,
    error,
    fetchVehicles,
    createVehicle,
    editVehicle,
    removeVehicle,
  } = useGarageStore();

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [actionSheetVehicle, setActionSheetVehicle] = useState<Vehicle | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const resetForm = () => {
    setMake("");
    setModel("");
    setYear("");
    setNickname("");
    setEditingId(null);
  };

  const openAddForm = () => {
    resetForm();
    setFormModalVisible(true);
  };

  const openEditForm = (vehicle: Vehicle) => {
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(String(vehicle.year));
    setNickname(vehicle.nickname ?? "");
    setEditingId(vehicle.id);
    setActionSheetVehicle(null);
    setFormModalVisible(true);
  };

  const handleSave = async () => {
    if (!make || !model || !year) return;
    const input = {
      make,
      model,
      year: parseInt(year, 10),
      nickname: nickname || null,
    };

    if (editingId) {
      await editVehicle(editingId, input);
    } else {
      await createVehicle(input);
    }

    resetForm();
    setFormModalVisible(false);
  };

  const handleDelete = async () => {
    if (!actionSheetVehicle) return;
    await removeVehicle(actionSheetVehicle.id);
    setActionSheetVehicle(null);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 16 }}>
        Garage
      </Text>

      {isLoading && <Text>Loading...</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: "#888" }}>No vehicles yet. Add one below.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => setActionSheetVehicle(item)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#333",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {item.nickname || `${item.year} ${item.make} ${item.model}`}
            </Text>
            <Text style={{ color: "#888" }}>
              {item.year} {item.make} {item.model}
            </Text>
          </Pressable>
        )}
      />

      <Pressable
        onPress={openAddForm}
        style={{
          backgroundColor: "#208AEF",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Add Vehicle</Text>
      </Pressable>

      {/* Action sheet: Edit / Delete */}
      <Modal visible={!!actionSheetVehicle} transparent animationType="fade">
        <Pressable
          onPress={() => setActionSheetVehicle(null)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View style={{ backgroundColor: "white", borderRadius: 12, margin: 16, overflow: "hidden" }}>
            <Pressable
              onPress={() => actionSheetVehicle && openEditForm(actionSheetVehicle)}
              style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}
            >
              <Text style={{ fontSize: 16 }}>Edit</Text>
            </Pressable>
            <Pressable onPress={handleDelete} style={{ padding: 16 }}>
              <Text style={{ fontSize: 16, color: "red" }}>Delete</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setActionSheetVehicle(null)}
            style={{ backgroundColor: "white", borderRadius: 12, margin: 16, marginTop: 0, padding: 16 }}
          >
            <Text style={{ fontSize: 16, textAlign: "center", color: "#888" }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add/Edit form */}
      <Modal visible={formModalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              {editingId ? "Edit Vehicle" : "Add Vehicle"}
            </Text>
            <TextInput
              placeholder="Make"
              value={make}
              onChangeText={setMake}
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Model"
              value={model}
              onChangeText={setModel}
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Year"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Nickname (optional)"
              value={nickname}
              onChangeText={setNickname}
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: "#208AEF",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Save</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                resetForm();
                setFormModalVisible(false);
              }}
              style={{ marginTop: 8 }}
            >
              <Text style={{ textAlign: "center", color: "#888" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
};