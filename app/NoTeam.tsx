import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function NoTeam() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text
        style={{
          fontSize: 24,
          textAlign: "center",
          fontWeight: "700",
          marginBottom: 30,
        }}
      >
        Welcome!
      </Text>

      <Text
        style={{
          textAlign: "center",
          fontSize: 16,
          marginBottom: 40,
          color: "#666",
        }}
      >
        You don’t have a team assigned yet, but you can still create posts and
        upload shorts.
      </Text>

      {/* Create Post */}
      <TouchableOpacity
        onPress={() => router.push("/create_news")}
        style={{
          backgroundColor: "#4f46e5",
          padding: 16,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          📝 Make Post
        </Text>
      </TouchableOpacity>

      {/* Create Shorts */}
      <TouchableOpacity
        onPress={() => router.push("/create_story")}
        style={{
          backgroundColor: "#059669",
          padding: 16,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          🎬 Create Shorts
        </Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: "#dc2626",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          🚪 Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}
