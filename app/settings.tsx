import RefreshableWrapper from "@/components/RefreshableWrapper";
import { BASE_URL } from "@/config";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { fetchWithAuth, user } = useAuth();

  const [managerName, setManagerName] = useState("");
  const [managerPhoto, setManagerPhoto] = useState<string | null>(null);
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [teamName, setTeamName] = useState("");
  const [savingTeamName, setSavingTeamName] = useState(false);

  const [savingName, setSavingName] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // =========================
  // Load team
  // =========================

  const loadTeam = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/my-team/`);

      if (res.ok) {
        const data = await res.json();

        setTeamName(data.name || "");
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

  // =========================
  // Pick image
  // =========================

  const pickImage = async (setter: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;

      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600, height: 600 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setter(manipulated.uri);
    } catch (err) {
      console.error("Image picker error:", err);

      Alert.alert(
        "Error",
        "Unable to select this image."
      );
    }
  };

  // =========================
  // Update field
  // =========================

  const updateField = async (
    field: "name" | "manager_name" | "manager_photo" | "logo",
    value: any
  ) => {
    const formData = new FormData();

    if (field === "name") {
      formData.append("name", value);
    } else if (field === "manager_name") {
      formData.append("manager_name", value);
    } else {
      formData.append(field, {
        uri: value.startsWith("file://") ? value : `file://${value}`,
        name: `${field}.jpg`,
        type: "image/jpeg",
      } as any);
    }

    try {
      if (field === "name") setSavingTeamName(true);
      if (field === "manager_name") setSavingName(true);
      if (field === "manager_photo") setSavingPhoto(true);
      if (field === "logo") setSavingLogo(true);

      const res = await fetchWithAuth(
        `${BASE_URL}/api/update-images/`,
        {
          method: "PUT",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        Alert.alert(
          "Success",
          field === "name"
            ? "Team name updated successfully."
            : field === "manager_name"
            ? "Manager name updated successfully."
            : field === "manager_photo"
            ? "Manager photo updated successfully."
            : "Team logo updated successfully."
        );

        await loadTeam();
      } else {
        const err = await res.json();

        Alert.alert(
          "Update Failed",
          err.error || "Failed to update."
        );
      }
    } catch (err) {
      console.error("Update error:", err);

      Alert.alert(
        "Network Error",
        "Unable to update your settings. Please try again."
      );
    } finally {
      setSavingTeamName(false);
      setSavingName(false);
      setSavingPhoto(false);
      setSavingLogo(false);
    }
  };

  // =========================
  // Change password
  // =========================

  const changePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert(
        "Missing Information",
        "Please enter both your old and new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Weak Password",
        "Your new password should contain at least 6 characters."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const res = await fetchWithAuth(
        `${BASE_URL}/api/change-password/`,
        {
          method: "POST",
          body: {
            old_password: oldPassword,
            new_password: newPassword,
          },
        }
      );

      if (res.ok) {
        Alert.alert(
          "Password Updated",
          "Your password has been changed successfully."
        );

        setOldPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();

        Alert.alert(
          "Password Change Failed",
          err.detail || "Failed to change password."
        );
      }
    } catch (err) {
      console.error("Password change error:", err);

      Alert.alert(
        "Network Error",
        "Unable to change your password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
      <RefreshableWrapper onRefresh={loadTeam}>

        {/* ================================= */}
        {/* Header */}
        {/* ================================= */}

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your manager profile and team
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MaterialIcons
              name="settings"
              size={25}
              color="#1d296b"
            />
          </View>
        </View>

        {/* ================================= */}
        {/* Manager Profile */}
        {/* ================================= */}

        <View style={styles.sectionCard}>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons
                name="person"
                size={20}
                color="#1d296b"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Manager Profile
              </Text>

              <Text style={styles.sectionSubtitle}>
                Update your manager information
              </Text>
            </View>
          </View>

          {/* Manager photo */}

          <View style={styles.profileArea}>

            <View style={styles.avatarContainer}>

              {managerPhoto ? (
                <Image
                  source={{ uri: managerPhoto }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons
                    name="person"
                    size={55}
                    color="#9aa0b5"
                  />
                </View>
              )}

            </View>

            <TouchableOpacity
              style={styles.outlineButton}
              activeOpacity={0.8}
              onPress={() => pickImage(setManagerPhoto)}
            >
              <MaterialIcons
                name="photo-camera"
                size={18}
                color="#1d296b"
              />

              <Text style={styles.outlineButtonText}>
                Change Photo
              </Text>
            </TouchableOpacity>

          </View>

          {/* Manager name */}

          <Text style={styles.inputLabel}>
            Manager Name
          </Text>

          <View style={styles.inputContainer}>

            <MaterialIcons
              name="badge"
              size={20}
              color="#8b91a7"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter manager name"
              placeholderTextColor="#9ca3af"
              value={managerName}
              onChangeText={setManagerName}
            />

          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              savingName && styles.disabledButton,
            ]}
            disabled={savingName}
            onPress={() =>
              updateField("manager_name", managerName)
            }
          >
            {savingName ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons
                  name="save"
                  size={19}
                  color="#fff"
                />

                <Text style={styles.primaryButtonText}>
                  Save Manager Name
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>

        {/* ================================= */}
{/* Team Branding */}
{/* ================================= */}

<View style={styles.sectionCard}>

  {/* Section Header */}
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIcon}>
      <MaterialIcons
        name="shield"
        size={20}
        color="#1d296b"
      />
    </View>

    <View>
      <Text style={styles.sectionTitle}>
        Team Branding
      </Text>

      <Text style={styles.sectionSubtitle}>
        Customize your team identity
      </Text>
    </View>
  </View>

  {/* ================================= */}
  {/* Team Name */}
  {/* ================================= */}

  <Text style={styles.inputLabel}>
    Team Name
  </Text>

  <View style={styles.inputContainer}>
    <MaterialIcons
      name="groups"
      size={20}
      color="#8b91a7"
    />

    <TextInput
      style={styles.input}
      placeholder="Enter team name"
      placeholderTextColor="#9ca3af"
      value={teamName}
      onChangeText={setTeamName}
      maxLength={100}
    />
  </View>

  <TouchableOpacity
    style={[
      styles.primaryButton,
      savingTeamName && styles.disabledButton,
    ]}
    disabled={savingTeamName}
    onPress={() => {
      if (!teamName.trim()) {
        Alert.alert(
          "Invalid Team Name",
          "Team name cannot be empty."
        );
        return;
      }

      updateField("name", teamName.trim());
    }}
  >
    {savingTeamName ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <>
        <MaterialIcons
          name="save"
          size={19}
          color="#fff"
        />

        <Text style={styles.primaryButtonText}>
          Save Team Name
        </Text>
      </>
    )}
  </TouchableOpacity>

  {/* ================================= */}
  {/* Divider */}
  {/* ================================= */}

  <View style={styles.brandingDivider} />

  {/* ================================= */}
  {/* Team Logo */}
  {/* ================================= */}

  <View style={styles.brandingBox}>

    <View style={styles.logoContainer}>
      {teamLogo ? (
        <Image
          source={{ uri: teamLogo }}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.logoPlaceholder}>
          <MaterialIcons
            name="shield"
            size={45}
            color="#9aa0b5"
          />
        </View>
      )}
    </View>

    <View style={styles.brandingInfo}>

      <Text style={styles.brandingTitle}>
        Team Logo
      </Text>

      <Text style={styles.brandingDescription}>
        Upload a square image for the best result.
      </Text>

      <TouchableOpacity
        style={styles.smallButton}
        activeOpacity={0.8}
        onPress={() => pickImage(setTeamLogo)}
      >
        <MaterialIcons
          name="upload"
          size={17}
          color="#1d296b"
        />

        <Text style={styles.smallButtonText}>
          Change Logo
        </Text>
      </TouchableOpacity>

    </View>

  </View>

  <TouchableOpacity
    style={[
      styles.primaryButton,
      savingLogo && styles.disabledButton,
    ]}
    disabled={savingLogo}
    onPress={() =>
      teamLogo && updateField("logo", teamLogo)
    }
  >
    {savingLogo ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <>
        <MaterialIcons
          name="save"
          size={19}
          color="#fff"
        />

        <Text style={styles.primaryButtonText}>
          Save Team Logo
        </Text>
      </>
    )}
  </TouchableOpacity>

</View>

        {/* ================================= */}
        {/* Security */}
        {/* ================================= */}

        <View style={styles.sectionCard}>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons
                name="lock"
                size={20}
                color="#d32f2f"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Security
              </Text>

              <Text style={styles.sectionSubtitle}>
                Keep your account secure
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>
            Current Password
          </Text>

          <View style={styles.inputContainer}>

            <MaterialIcons
              name="lock-outline"
              size={20}
              color="#8b91a7"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#9ca3af"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />

          </View>

          <Text style={styles.inputLabel}>
            New Password
          </Text>

          <View style={styles.inputContainer}>

            <MaterialIcons
              name="lock-reset"
              size={20}
              color="#8b91a7"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#9ca3af"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

          </View>

          <TouchableOpacity
            style={[
              styles.passwordButton,
              changingPassword && styles.disabledButton,
            ]}
            disabled={changingPassword}
            onPress={changePassword}
          >
            {changingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons
                  name="lock"
                  size={19}
                  color="#fff"
                />

                <Text style={styles.primaryButtonText}>
                  Change Password
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>

        <View style={styles.bottomSpace} />

      </RefreshableWrapper>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f4f6fb",
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#18204a",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#7b8197",
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#e8ebf7",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ================= CARD ================= */

  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef0fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#20243b",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#8a8fa3",
    marginTop: 2,
  },

  /* ================= PROFILE ================= */

  profileArea: {
    alignItems: "center",
    marginBottom: 22,
  },

  avatarContainer: {
    marginBottom: 12,
  },

  avatar: {
    width: 125,
    height: 125,
    borderRadius: 63,
    borderWidth: 4,
    borderColor: "#e6e9f4",
  },

  avatarPlaceholder: {
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: "#eef0f5",
    borderWidth: 4,
    borderColor: "#e6e9f4",
    justifyContent: "center",
    alignItems: "center",
  },

  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#cfd4e5",
    backgroundColor: "#fff",
  },

  outlineButtonText: {
    color: "#1d296b",
    fontSize: 13,
    fontWeight: "600",
  },

  /* ================= INPUT ================= */

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#51576d",
    marginBottom: 7,
  },

  inputContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e3eb",
    borderRadius: 11,
    paddingHorizontal: 13,
    backgroundColor: "#fafbfc",
    marginBottom: 14,
  },

  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: "#25293b",
  },

  /* ================= BRANDING ================= */

  brandingBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  logoContainer: {
    width: 105,
    height: 105,
    borderRadius: 16,
    backgroundColor: "#f5f6fa",
    borderWidth: 1,
    borderColor: "#e1e4ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  logo: {
    width: 85,
    height: 85,
  },

  logoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  brandingInfo: {
    flex: 1,
  },

  brandingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#282d42",
    marginBottom: 5,
  },

  brandingDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: "#858a9e",
    marginBottom: 10,
  },

  smallButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eef0fa",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },

  smallButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1d296b",
  },

  /* ================= BUTTONS ================= */

  primaryButton: {
    minHeight: 46,
    borderRadius: 11,
    backgroundColor: "#1d296b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  passwordButton: {
    minHeight: 46,
    borderRadius: 11,
    backgroundColor: "#d32f2f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  bottomSpace: {
    height: 30,
  },
});