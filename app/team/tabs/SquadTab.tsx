import { BASE_URL } from "@/config";
import { Link } from "expo-router";
import { FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Player {
  id: number;
  full_name: string;
  position: string;
  club_name: string;
  photo: string;
  weekly_wage: number;
  points: number;
  is_academy_player: boolean;
}

interface TeamDetail {
  team_name: string;
  logo: string;
  manager_name: string;
  manager_photo: string;
  players: Player[];
}

export default function SquadTab({ team }: { team: TeamDetail }) {
  const POSITION_ORDER: Record<string, number> = { GK: 1, DF: 2, MF: 3, FW: 4 };
  const POSITION_LABEL: Record<string, string> = {
    GK: "Goalkeepers",
    DF: "Defenders",
    MF: "Midfielders",
    FW: "Forwards",
  };

  const groupByPosition = (players: Player[]) => {
    const result: any[] = [];
    Object.keys(POSITION_ORDER)
      .sort((a, b) => POSITION_ORDER[a] - POSITION_ORDER[b])
      .forEach((pos) => {
        const playersOfPos = players.filter((p) => p.position === pos);
        if (playersOfPos.length > 0) {
          result.push({ type: "subheader", title: POSITION_LABEL[pos] });
          result.push(
            ...playersOfPos.map((p) => ({ type: "player", data: p }))
          );
        }
      });
    return result;
  };

  const mainPlayers = team.players.filter((p) => !p.is_academy_player);
  const academyPlayers = team.players.filter((p) => p.is_academy_player);

  const renderPlayer = ({
    item,
    sectionType,
    index,
  }: {
    item: Player;
    sectionType: "main" | "academy";
    index: number;
  }) => {
    const sectionColors = {
      main: "#e0f7fa",
      academy: "#f3e5f5",
    };
    const backgroundColor = index % 2 === 0 ? sectionColors[sectionType] : "#ffffff";

    return (
      <Link href={`/team/player/${item.id}`} asChild>
        <TouchableOpacity style={{
          backgroundColor:
            item.weekly_wage === 0
            ? "#ff4d4d"
            :"#ffffffff", 
          marginVertical: 4,
          borderRadius: 8,
          padding: 8,
          elevation: 2}}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: `${BASE_URL}${item.photo}` }}
            style={styles.playerPhoto}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>{item.full_name}</Text>
            <Text style={styles.playerInfo}>
              {item.position} • {item.club_name || "Unknown"}
            </Text>
            <Text style={styles.playerWage}>
              Wage: {item.weekly_wage.toFixed(3)} • {item.points || 0} pts
            </Text>
          </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const renderSectionCard = (
    title: string,
    players: Player[],
    sectionType: "main" | "academy"
  ) => (
    <View
      key={`${sectionType}-section`}
      style={[
        styles.sectionCard,
        { backgroundColor: sectionType === "main" ? "#b2ebf2" : "#e1bee7" },
      ]}
    >
      <Text style={styles.sectionHeader}>{title}</Text>
      {groupByPosition(players).map((item, idx) => {
        if (item.type === "subheader") {
          return (
            <Text
              key={`${sectionType}-subheader-${item.title}-${idx}`}
              style={styles.subSectionHeader}
            >
              {item.title}
            </Text>
          );
        }
        if (item.type === "player") {
          return (
            <View key={`${sectionType}-player-${item.data.id}`}>
              {renderPlayer({ item: item.data, sectionType, index: idx })}
            </View>
          );
        }
        return null;
      })}
    </View>
  );

  return (
    <FlatList
      ListHeaderComponent={
        <View style={{
            borderRadius: 20, backgroundColor: '#0fa4d1ff', elevation: 3, borderColor: '#ddd', borderWidth: 1, marginBottom: 16
          }}>
          <Text style= {{fontSize: 18, fontWeight: "bold", alignSelf: "center", padding: 5}}>Manager</Text> 
          <View style={{ backgroundColor: '#ffffffff', padding: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, }}>   
          <ImageBackground
            source={{ uri: team.logo }}
            imageStyle={{opacity: 0.2, resizeMode: "contain"}}          
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Image
              source={{ uri: team.manager_photo }}
              style={{ width: 100, height: 100, borderRadius: 50, alignSelf: "flex-end", marginBottom: 16, borderColor: "#3ca9b8ff", borderWidth: 2 }}
              resizeMode="contain"
              />
              <View style={{ flex:1, marginLeft:10, alignItems: "flex-end", maxWidth:"70%"}}>
              <Text style={{ textAlign: "right", fontWeight: "600", fontSize: 17 }}>{team.manager_name}</Text>
              <Text style={{ textAlign: "right" }}>Club: {team.team_name}</Text>
              </View>
            </View>
          </ImageBackground>
          </View>
        </View>
      }
      data={[1]} // dummy data, actual rendering handled below
      keyExtractor={(item, index) => `${index}`}
      renderItem={() => (
        <>
          {renderSectionCard("Main Squad", mainPlayers, "main")}
          {renderSectionCard("Academy Players", academyPlayers, "academy")}
        </>
      )}
      contentContainerStyle={{ padding: 12 }}
    />
  );
}

const styles = StyleSheet.create({
  teamName: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  sectionCard: { padding: 12, borderRadius: 12, marginBottom: 16, elevation: 3 },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 8, alignSelf: "center"},
  subSectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#d1c4e9",
    borderRadius: 6,
  },
  playerCard: { flexDirection: "row", padding: 8, marginVertical: 4, borderRadius: 8 },
  playerPhoto: { width: 60, height: 60, marginRight: 12 },
  playerName: { fontSize: 16, fontWeight: "600" },
  playerInfo: { color: "#666" },
  playerWage: { marginTop: 4, color: "#444" },
});