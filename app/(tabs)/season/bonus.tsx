import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BASE_URL } from "../../../config";

interface Team {
  id: number;
  name: string;
  logo?: string;
  manager_name?: string;
}

interface Season {
  id: number;
  name: string;
}

interface BonusPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team_name: string;
}

interface WeeklyDetail {
  id: number;
  gameweek: number;
  created_at: string;
  highest_point_teams: Team[];
  highest_point_players: BonusPlayer[];
  highest_gk_players: BonusPlayer[];
  highest_df_players: BonusPlayer[];
  highest_mf_players: BonusPlayer[];
  highest_fw_players: BonusPlayer[];
  special_bonus_players: BonusPlayer[];
}

interface BonusData {
  season_id: number;
  team_id: number | null;
  total_bonus: Record<string, number>;
  weekly_details: WeeklyDetail[];
}

export default function BonusScreen() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bonusData, setBonusData] = useState<BonusData | null>(null);
  const [loadingSeasons, setLoadingSeasons] = useState(true);

  // Fetch seasons from backend
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/seasons/`);
        const formatted = res.data.map((season: any) => ({
          id: season.id,
          name: season.season_name,
        }));
        setSeasons(formatted);
        if (formatted.length > 0) setSelectedSeason(formatted[0].id);
      } catch (err) {
        console.error("Error fetching seasons:", err);
      } finally {
        setLoadingSeasons(false);
      }
    };
    fetchSeasons();
  }, []);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/teams/`);
        setTeams(res.data);
      } catch (err) {
        console.warn("Couldn't load teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // Fetch bonus whenever season or team changes
  useEffect(() => {
    if (!selectedSeason) return;
    fetchBonus();
  }, [selectedSeason, selectedTeam]);

  const fetchBonus = async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}/api/bonus/season/${selectedSeason}/${
        selectedTeam ? `?team=${selectedTeam}` : ""
      }`;
      const res = await axios.get(url);
      setBonusData(res.data);
    } catch (err) {
      console.error("Error fetching bonus data:", err);
      setBonusData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderTeamList = (title: string, teams: Team[]) => {
    if (!teams || teams.length === 0) return null;
    return (
        <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {teams.map(team => (
            <View style={{ flex:1 ,flexDirection: "row", alignContent: "center" }} key={team.id}>
            <Image style={{ width: 20, height: 20 }}
                source={{ uri: `${BASE_URL}/api${team.logo}` }}
            />
            <Text style={{fontWeight: "bold", color: "white"}}>{team.name}</Text>
            <Text style={styles.playerText}>{team.manager_name}</Text>
            
            </View>
        ))}
        </View>
    );
};
  const renderPlayerList = (title: string, players: BonusPlayer[]) => {
    if (!players || players.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {players.map((p) => (
        <View key = {p.id} style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.playerText}>
            • {p.first_name} {p.last_name} ({p.position}) —
          </Text>
          <Image style={{ width: 20, height: 20 }}
                source={{ uri: `${BASE_URL}/api${p.logo}` }}
            />
          <Text style={styles.teamName}>
            {p.team_name}
          </Text>
        </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView>
        <Text style={styles.header}>Bonus Overview</Text>

      {/* Season Picker */}
      <View style={{ paddingHorizontal: 15, flexDirection: "row", alignContent: "space-between"}}>
      <View style={styles.pickerContainer}>
        {loadingSeasons ? (
          <ActivityIndicator color="#00C2FF" />
        ) : (
          <Picker
            selectedValue={selectedSeason}
            style={styles.picker}
            onValueChange={(value) => setSelectedSeason(value)}
          >
            {seasons.map((season) => (
              <Picker.Item key={season.id} label={season.name} value={season.id} />
            ))}
          </Picker>
        )}
      </View>

      {/* Team Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTeam}
          style={styles.picker}
          onValueChange={(value) => setSelectedTeam(value)}
        >
          <Picker.Item label="All Teams" value={null} />
          {teams.map((team) => (
            <Picker.Item key={team.id} label={team.name} value={team.id} />
          ))}
        </Picker>
      </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00C2FF" style={{ marginTop: 20 }} />
      ) : bonusData ? (
        <View style={styles.container}>
        <View style={{ alignItems: "center", backgroundColor: "#0047a3ff", padding: 10, borderRadius: 10, marginBottom: 10 }}>
          <Text style={styles.subHeader}>Total Bonus</Text>
        </View>
          {Object.entries(bonusData.total_bonus).map(([teamId, data]: [string, any]) => (
            <View key={teamId} style={{ flex: 1, alignContent: "space-evenly", backgroundColor: "#0066ccff", padding: 8, borderRadius: 5, marginVertical: 2 }}>
                <View style={{ flexDirection: "row" }}>              
                {data.logo && (
                <Image style={{ width: 30, height: 30 }}
                    source={{ uri: `${BASE_URL}/api${data.logo}` }}
                />
                )}
                <Text style={{fontSize: 18, fontWeight: "600", color: "white", marginLeft: 5}}>
                {data.team_name}: {Number(data.bonus ?? 0).toFixed(1)}M
                </Text>
                </View>
            </View>
            ))}
        <View style={{ alignItems: "center", backgroundColor: "#0047a3ff", padding: 10, borderRadius: 10, marginVertical: 10, marginTop:20 , marginBottom:2.5}}>
          <Text style={styles.subHeader}>Weekly Details</Text>
        </View>
          {bonusData.weekly_details.map((week) => (
            <View key={week.id} style={styles.weekCard}>
              <Text style={styles.weekTitle}>Gameweek {week.gameweek}</Text>
              {renderTeamList("Highest Point Teams", week.highest_point_teams)}
              {renderPlayerList("Highest Point Players", week.highest_point_players)}
              {renderPlayerList("Best Goalkeepers", week.highest_gk_players)}
              {renderPlayerList("Best Defenders", week.highest_df_players)}
              {renderPlayerList("Best Midfielders", week.highest_mf_players)}
              {renderPlayerList("Best Forwards", week.highest_fw_players)}
              {renderPlayerList("Special Bonus", week.special_bonus_players)}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noData}>No data available</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#ffffffff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000ff",
    textAlign: "center",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffffff",
    marginVertical: 10,
  },
  pickerContainer: {
    backgroundColor: "#00367cff",
    borderRadius: 10,
    padding: 5,
    marginVertical: 5,
    marginHorizontal: 10,
    flex: 1,
    alignSelf: "center",
    alignContent: "center",
  },
  picker: {
    color: "#ffffffff",
  },
  label: {
    color: "#aaa",
    marginBottom: 5,
  },
  bonusText: {
    color: "#000000ff",
    fontSize: 15,
    marginVertical: 2,
  },
  weekCard: {
    backgroundColor: "#082e63ff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  weekTitle: {
    color: "#FFD700",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 5,
  },
  section: {
    marginVertical: 5,
  },
  sectionTitle: {
    color: "#00FFB2",
    fontWeight: "600",
    marginBottom: 3,
  },
  playerText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 10,
  },
  noData: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 20,
  },
  teamName: { fontSize: 14, fontWeight: "bold", color: "white"}
});
