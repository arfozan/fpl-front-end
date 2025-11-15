import RefreshableWrapper from "@/components/RefreshableWrapper";
import { BASE_URL } from "@/config";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function MyTeam() {
  const { user, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [expiringCount, setExpiringCount] = useState(0);
  const [team, setTeam] = useState<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Logged out", "You have been logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };


  const fetchTeamData = async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/my-team-players/`);
      const data = await res.json();
      setExpiringCount(data.expiring_contracts_count || 0);
      setTeam({
        ...data.team,
        main_players_count: data.main_players_count,
        academy_players_count: data.academy_players_count,
        total_weekly_wage: data.total_weekly_wage, 
        season_bonus: data.season_bonus,
      });
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: "#555" }}>Please log in to view your team.</Text>
      </View>
    );
  }

  return (
    <RefreshableWrapper onRefresh={fetchTeamData}>
      
        {team ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* 🌟 Team Banner */}
            <LinearGradient
              colors={["#f5d142", "#c71d1d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <Image source={{ uri: user.logo }} style={styles.teamLogo} resizeMode="contain" />
              <View>
                <Text style={styles.teamName}>{user.name}</Text>
                <Text style={styles.subTitle}>Season Overview</Text>
              </View>
            </LinearGradient>

            {/* 💼 Team Info Card */}
            <ImageBackground
              source={{ uri: user.logo }}
              style={styles.card}
              imageStyle={{ borderRadius: 25, opacity: 0.08 }}
            >
              <Text style={styles.cardHeader}>Financial Summary</Text>
              <View style={styles.cardDetails}>
                <Text style={styles.detailText}>
                  Current Balance:{" "}
                  <Text style={styles.valueText}>{team.current_balance.toFixed(2)}M</Text>
                </Text>
                <Text style={styles.detailText}>
                  Predicted End Balance:{" "}
                  <Text style={styles.valueText}>{team.forecast_end_balance.toFixed(2)}M</Text>
                </Text>
                <Text style={styles.detailText}>
                  Weekly Wage: {" "}<Text style={styles.valueText}>{team.total_weekly_wage.toFixed(2)}M</Text>
                </Text>
                <Text style={styles.detailText}>
                  Yearly Wage: {" "}<Text style={styles.valueText}>{team.yearly_wage_total.toFixed(2)}M</Text>
                </Text>
                <Text style={styles.detailText}>
                  Current Wage Cost: <Text style={styles.valueText}>{team.wage_cost.toFixed(2)}M</Text>
                </Text>
                <Text style={styles.detailText}>
                  Current Season Bonus: <Text style={styles.valueText}>{team.season_bonus.toFixed(2)}M</Text>
                </Text>
                <Text style={styles.detailText}>
                  Main Players: <Text style={styles.valueText}>{team.main_players_count}</Text>
                </Text>
                <Text style={styles.detailText}>
                  Academy Players: <Text style={styles.valueText}>{team.academy_players_count}</Text>
                </Text>
              </View>
            </ImageBackground>

            {/* 👔 Manager Section */}
            <View style={styles.managerSection}>
              <Image source={{ uri: user.manager_photo }} style={styles.managerPhoto} />
              <Text style={styles.managerName}>{user.manager_name}</Text>
              <Text style={styles.managerRole}>Team Manager</Text>
            </View>

            {/* ⚙️ Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/create_news")}
              >
                <Text style={styles.buttonText}>Make a Post</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/create_story")}
              >
                <Text style={styles.buttonText}>Create Story</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/squad")}>
                <Text style={styles.buttonText}>Squad</Text>
                {expiringCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{expiringCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/available_players")}
              >
                <Text style={styles.buttonText}>Make Transfer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/IncomingRequest")}
              >
                <Text style={styles.buttonText}>Transfer Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/settings")}
              >
                <Text style={styles.buttonText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.centered}>
            <Text style={{ fontSize: 16, color: "#555" }}>Loading your team...</Text>
          </View>
        )}
      
    </RefreshableWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  teamLogo: {
    width: 70,
    height: 70,
    marginRight: 16,
  },
  teamName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  subTitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 20,
    margin: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  cardDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 15,
    color: "#444",
  },
  valueText: {
    fontWeight: "700",
    color: "#1d296b",
  },
  managerSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  managerPhoto: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#1d296b",
    marginBottom: 8,
  },
  managerName: {
    fontSize: 18,
    fontWeight: "700",
  },
  managerRole: {
    fontSize: 14,
    color: "#555",
  },
  buttonContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#1d296b",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    width: "80%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  secondaryButton: {
    backgroundColor: "#ececec",
    paddingVertical: 12,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryText: {
    color: "#1d296b",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#b00020",
    paddingVertical: 12,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    marginBottom: 30,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: 18,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
});
