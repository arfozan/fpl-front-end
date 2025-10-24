import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // ✅ for showing errors
  const [loading, setLoading] = useState(false); // ✅ for disabling button

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      // show meaningful error message
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: "#ccccccff", flex: 1 }}>
      <ImageBackground
        source={require("../assets/images/pl_card.png")}
        resizeMode="cover"
        style={{
          borderRadius: 10,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: 10,
            alignContent: "center",
            justifyContent: "flex-start",
            flexDirection: "row",
          }}
        >
          <View style={{ flex: 0.5 }}>
            <Text
              style={{ fontSize: 24, fontWeight: "bold", marginLeft: 10, marginTop: 20 }}
            >
              Play
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginLeft: 10 }}>
              Biggest
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginLeft: 10 }}>
              Fantasy
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              alignContent: "flex-end",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                alignItems: "center",
                marginTop: 60,
                marginRight: 20,
              }}
            >
              Log In
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                alignItems: "center",
                marginRight: 20,
              }}
            >
              Now!
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10 }}>
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            marginVertical: 8,
            padding: 8,
          }}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            marginVertical: 8,
            padding: 8,
          }}
        />

        {/* ✅ Error message */}
        {error ? (
          <Text style={{ color: "red", textAlign: "center", marginTop: 5 }}>
            {error}
          </Text>
        ) : null}

        {/* ✅ Login button */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#999" : "#3b4ce9ff",
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 10,
          }}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff" }}>LOG IN</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
