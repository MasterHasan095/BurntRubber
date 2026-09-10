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

export default function GarageScreen() {
  const { vehicles, isLoading, error, fetchVehicles, createVehicle, removeVehicle } =
    useGarageStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAdd = async () => {
    if (!make || !model || !year) return;
    await createVehicle({
      make,
      model,
      year: parseInt(year, 10),
      nickname: nickname || null,
    });
    setMake("");
    setModel("");
    setYear("");
    setNickname("");
    setModalVisible(false);
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
            onLongPress={() => removeVehicle(item.id)}
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
        onPress={() => setModalVisible(true)}
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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              Add Vehicle
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
              onPress={handleAdd}
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
            <Pressable onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
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