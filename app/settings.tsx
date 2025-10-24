import RefreshableWrapper from "@/components/RefreshableWrapper";
import { BASE_URL } from "@/config";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { fetchWithAuth, user } = useAuth();

  const [managerName, setManagerName] = useState("");
  const [managerPhoto, setManagerPhoto] = useState<string | null>(null);
  const [teamLogo, setTeamLogo] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Load current team info
  const loadTeam = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/my-team/`);
      if (res.ok) {
        const data = await res.json();
        setManagerName(data.manager_name || "");
        setManagerPhoto(data.manager_photo || null);
        setTeamLogo(data.logo || null);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  // Pick image from gallery
  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  // Update single field (name/photo/logo)
  const updateField = async (field: "manager_name" | "manager_photo" | "logo", value: any) => {
    const formData = new FormData();
    if (field === "manager_name") {
      formData.append("manager_name", value);
    } else {
      formData.append(field, {
        uri: value.startsWith("file://") ? value : `file://${value}`,
        name: `${field}.jpg`,
        type: "image/jpeg",
      } as any);
    }

    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/update-images/`, {
        method: "PUT",
        body: formData,
        headers: { Accept: "application/json" }, // do NOT set Content-Type for FormData
      });

      if (res.ok) {
        Alert.alert("✅ Success", `${field} updated!`);
        loadTeam(); // refresh values
      } else {
        const err = await res.json();
        Alert.alert("❌ Error", err.error || "Failed to update");
      }
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("❌ Error", "Network error while updating");
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/change-password/`, {
        method: "POST",
        body: { old_password: oldPassword, new_password: newPassword },
      });

      if (res.ok) {
        Alert.alert("✅ Success", "Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        Alert.alert("❌ Error", err.detail || "Failed to change password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      Alert.alert("❌ Error", "Network error while changing password");
    }
  };

  return (
    <View style={styles.container}>
    <RefreshableWrapper onRefresh={loadTeam}>
      <Text style={styles.header}>⚙️ Settings</Text>

      {/* Manager Name */}
      <TextInput
        style={styles.input}
        placeholder="Manager Name"
        value={managerName}
        onChangeText={setManagerName}
      />
      <TouchableOpacity style={styles.saveBtn} onPress={() => updateField("manager_name", managerName)}>
        <Text style={styles.saveBtnText}>💾 Save Name</Text>
      </TouchableOpacity>

      {/* Manager Photo */}
      <View style={styles.imageSection}>
        {managerPhoto ? (
          <Image source={{ uri: managerPhoto }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.placeholder]}>
            <Text style={{ color: "#888" }}>No Photo</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.imageButton}
          activeOpacity={0.8}
          onPress={() => pickImage(setManagerPhoto)}
        >
          <Text style={styles.link}>📸 Change Manager Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => managerPhoto && updateField("manager_photo", managerPhoto)}
        >
          <Text style={styles.saveBtnText}>💾 Save Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Team Logo */}
      <View style={styles.imageSection}>
        {teamLogo ? (
          <Image source={{ uri: teamLogo }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.placeholder]}>
            <Text style={{ color: "#888" }}>No Logo</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.imageButton}
          activeOpacity={0.8}
          onPress={() => pickImage(setTeamLogo)}
        >
          <Text style={styles.link}>🪄 Change Team Logo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => teamLogo && updateField("logo", teamLogo)}
        >
          <Text style={styles.saveBtnText}>💾 Save Logo</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Change Password */}
      <TextInput
        style={styles.input}
        placeholder="Old Password"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#e63946" }]} onPress={changePassword}>
        <Text style={styles.saveBtnText}>🔒 Change Password</Text>
      </TouchableOpacity>
    </RefreshableWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginBottom: 20 },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 20, color: "#1d296bff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  link: { color: "#1d296bff", fontWeight: "600", textAlign: "center" },
  imageSection: { marginBottom: 25, alignItems: "center" },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 100, // makes image perfectly round
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#1d296bff",
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  imageButton: {
    backgroundColor: "rgba(29, 41, 107, 0.1)", // slightly transparent background
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  divider: { marginVertical: 20, borderBottomWidth: 1, borderColor: "#ddd" },
  saveBtn: {
    backgroundColor: "#1d296bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});