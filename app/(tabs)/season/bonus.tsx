import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  logo: string;
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

interface MonthlyBonus {
  id: number;
  season: string;
  month: string;
  team: string;
  team_id: number | null;
  player: string;
  photo: string | null;
  bonus_amount: number;
  category: string;
}

interface TotalBonus {
  team_id: number;
  team_name: string;
  logo: string;
  manager_name: string;
  bonus: number;
}

interface BonusData {
  season_id: number;
  team_id: number | null;
  total_bonus: TotalBonus[];
  weekly_details: WeeklyDetail[];
  monthly_bonus: MonthlyBonus[];
}

export default function BonusScreen() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);

  const [bonusData, setBonusData] = useState<BonusData | null>(null);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/seasons/`);

        const formatted = res.data.map((season: any) => ({
          id: season.id,
          name: season.season_name,
        }));

        setSeasons(formatted);

        if (formatted.length > 0) {
          setSelectedSeason(formatted[0].id);
        }
      } catch (err) {
        console.error("Error loading seasons:", err);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchSeasons();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/teams/`);
        setTeams(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeams();
  }, []);

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
      console.error(err);
      setBonusData(null);
    } finally {
      setLoading(false);
    }
    
  };

  const renderTeamList = (title: string, teams: Team[]) => {
    if (!teams.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {teams.map((team) => (
          <View
            key={team.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            {team.logo && (
              <Image
                source={{ uri: `${BASE_URL}/api${team.logo}` }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  marginRight: 8,
                }}
              />
            )}

            <Text style={styles.teamName}>{team.name}</Text>

            {!!team.manager_name && (
              <Text style={styles.playerText}>
                {" "}
                ({team.manager_name})
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPlayerList = (title: string, players: BonusPlayer[]) => {
    if (!players.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {players.map((p) => (
          <View
            key={p.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <Text style={[styles.playerText, { flex: 1 }]}>
              • {p.first_name} {p.last_name} ({p.position})
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Text style={styles.teamName}>
                {p.team_name}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <Text style={styles.header}>Bonus Overview</Text>

      {/* Pickers */}

      <View
        style={{
          paddingHorizontal: 15,
          flexDirection: "row",
        }}
      >
        <View style={styles.pickerContainer}>
          {loadingSeasons ? (
            <ActivityIndicator color="#00C2FF" />
          ) : (
            <Picker
              selectedValue={selectedSeason}
              style={styles.picker}
              dropdownIconColor="#fff"
              onValueChange={(value) => setSelectedSeason(value)}
            >
              {seasons.map((season) => (
                <Picker.Item
                  key={season.id}
                  label={season.name}
                  value={season.id}
                />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTeam}
            style={styles.picker}
            dropdownIconColor="#fff"
            onValueChange={(value) => setSelectedTeam(value)}
          >
            <Picker.Item
              label="All Teams"
              value={null}
            />

            {teams.map((team) => (
              <Picker.Item
                key={team.id}
                label={team.name}
                value={team.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#00C2FF"
          style={{ marginTop: 30 }}
        />
      ) : !bonusData ? (
        <Text style={styles.noData}>
          No data available
        </Text>
      ) : (
        <View style={styles.container}>
          {/* TOTAL BONUS */}

          <View
            style={{
              backgroundColor: "#0047a3",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <Text style={styles.subHeader}>
              Total Bonus
            </Text>
          </View>

          {bonusData.total_bonus.map((team, index) => (
            <TouchableOpacity
              key={team.team_id}
              onPress={() => router.push(`/team/${team.team_id}`)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#0066cc",
                padding: 8,
                borderRadius: 5,
                marginVertical: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={{ uri: `${BASE_URL}${team.logo}` }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    marginRight: 8,
                  }}
                />

                <Text style={{ color: "white", fontWeight: "600" }}>
                  {team.team_name}
                </Text>
              </View>

              <Text style={{ color: "white", fontWeight: "700" }}>
                {team.bonus.toFixed(1)}M
              </Text>
            </TouchableOpacity>
          ))}

          {/* WEEKLY */}

          <View
            style={{
              backgroundColor: "#0047a3",
              padding: 10,
              borderRadius: 10,
              marginTop: 25,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <Text style={styles.subHeader}>
              Weekly Bonus
            </Text>
          </View>

          {bonusData.weekly_details.map((week) => (
            <View
              key={week.id}
              style={styles.weekCard}
            >
              <Text style={styles.weekTitle}>
                Gameweek {week.gameweek}
              </Text>

              {renderTeamList(
                "Highest Point Teams",
                week.highest_point_teams
              )}

              {renderPlayerList(
                "Highest Point Players",
                week.highest_point_players
              )}

              {renderPlayerList(
                "Best Goalkeepers",
                week.highest_gk_players
              )}

              {renderPlayerList(
                "Best Defenders",
                week.highest_df_players
              )}

              {renderPlayerList(
                "Best Midfielders",
                week.highest_mf_players
              )}

              {renderPlayerList(
                "Best Forwards",
                week.highest_fw_players
              )}

              {renderPlayerList(
                "Team of the Week Bonus",
                week.special_bonus_players
              )}
            </View>
          ))}

          {/* MONTHLY */}

          <View
            style={{
              backgroundColor: "#0047a3",
              padding: 10,
              borderRadius: 10,
              marginTop: 25,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <Text style={styles.subHeader}>
              Monthly Bonus
            </Text>
          </View>

          {bonusData.monthly_bonus.length === 0 ? (
            <Text
              style={{
                color: "#777",
                textAlign: "center",
              }}
            >
              No monthly bonus awarded.
            </Text>
          ) : (
            bonusData.monthly_bonus.map((bonus) => (
              <View
                key={bonus.id}
                style={{
                  backgroundColor: "#082e63",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{
                    uri: `${BASE_URL}${bonus.photo}`,
                  }}
                  style={{
                    width: 55,
                    height: 55,
                    borderRadius: 28,
                  }}
                />

                <View
                  style={{
                    flex: 1,
                    marginLeft: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {bonus.player}
                  </Text>

                  <Text
                    style={{
                      color: "#00FFB2",
                    }}
                  >
                    {bonus.team}
                  </Text>

                  <Text
                    style={{
                      color: "#ccc",
                      marginTop: 2,
                    }}
                  >
                    {bonus.category}
                  </Text>

                  <Text
                    style={{
                      color: "#888",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {bonus.month}
                  </Text>
                </View>

                <Text
                  style={{
                    color: "#FFD700",
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  +{bonus.bonus_amount.toFixed(1)}M
                </Text>
              </View>
            ))
          )}
        </View>
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
