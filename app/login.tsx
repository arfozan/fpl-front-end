import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
      <ImageBackground
        source={require("../assets/images/bg-card.jpg")}
        resizeMode="cover"
        style={{flex:1, width: "100%", height: "100%"}}
      >
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: 10,
            alignContent: "center",
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                alignItems: "center",
                marginTop: 60,
                color:"#ffff"
              }}
            >
              To Manage Youn Team
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                alignItems: "center",
                color:"#ffff"
              }}
            >
              Log In Now!
            </Text>
          </View>
        </View>
      <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, marginHorizontal: 10}}>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#808080ff"
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
          placeholderTextColor="#808080ff"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            marginVertical: 8,
            padding: 8,
            color:"#000000ff"
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
    </ImageBackground>
  );
}
