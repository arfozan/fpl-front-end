// screens/AvailablePlayers.tsx
import { BASE_URL } from "@/config";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

interface Player {
  id: number;
  full_name: string;
  club_name: string;
  photo: string;
  team: string | null;
  position: string;
  value: string;
}

interface Team {
  id: number;
  name: string;
}

export default function AvailablePlayers() {
  const { fetchWithAuth } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // filter states
  const [selectedTeam, setSelectedTeam] = useState<string>(""); // team name
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const res = await fetchWithAuth(`${BASE_URL}/api/players/available/`);
      const teamsRes = await fetchWithAuth(`${BASE_URL}/api/team-summary/`);
      if (res.ok) {
        setPlayers(await res.json());
      }
      if (teamsRes.ok) {
        setTeams(await teamsRes.json());
      }
      setLoading(false);
    };
    load();
  }, []);

  // apply filters on the fly
  const filteredPlayers = players.filter((p) => {
    let ok = true;
    if (selectedTeam && p.team !== selectedTeam) ok = false;
    if (selectedPosition && p.position !== selectedPosition) ok = false;
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) ok = false;
    return ok;
  });

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <TextInput
        placeholder="Search by name"
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          padding: 8,
          marginBottom: 8,
          borderRadius: 6,
        }}
      />
      <Picker
        selectedValue={selectedTeam}
        onValueChange={(value) => setSelectedTeam(value)}
        style={{ marginBottom: 8 }}
      >
        <Picker.Item label="All Teams" value="" />
        {teams.map((t) => (
          <Picker.Item key={t.id} label={t.name} value={t.name} />
        ))}
      </Picker>

      <Picker
        selectedValue={selectedPosition}
        onValueChange={(value) => setSelectedPosition(value)}
        style={{ marginBottom: 8 }}
      >
        <Picker.Item label="All Positions" value="" />
        <Picker.Item label="Goalkeeper" value="GK" />
        <Picker.Item label="Defender" value="DF" />
        <Picker.Item label="Midfielder" value="MF" />
        <Picker.Item label="Forward" value="FW" />
      </Picker>

      {/* Player list */}
      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`${item.id}`)}
            style={{marginVertical: 4, borderRadius: 8, overflow: "hidden", backgroundColor: "#ffffff", elevation: 2}}
          >
            <ImageBackground source={require("../assets/images/tw_banner.png")} style={{flexDirection:"row", borderRadius: 8, padding: 15, justifyContent: "space-between", alignItems: "center"}} resizeMode="cover" imageStyle={{ opacity: 0.8 }}>
              <View>
                <Text style={{fontSize:18, fontWeight: "600"}}>{item.full_name}</Text>
                <Text style= {{fontWeight: "semi-bold"}}>{item.team}</Text>
                <Text>Club: {item.club}</Text>
                <Text>Points: {item.points} || Position: {item.position}</Text>
              </View>
              <Image
                source={{ uri: item.photo }}
                style={{ width: 80, height: 80, borderRadius: 20}}
                resizeMode="contain"
              />
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
