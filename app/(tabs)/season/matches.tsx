import { BASE_URL } from "@/config";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Match {
  match_id: number;
  home_team: Team;
  away_team: Team;
  home_score: number;
  away_score: number;
}

interface Round {
  round_id: number;
  round_number: number;
  date: string | null;
  is_ended: boolean;
  match_count: number;
  matches: Match[];
}

interface SeasonFixtures {
  season_id: number;
  season_name: string;
  rounds: Round[];
}

interface SeasonListItem {
  id: number;
  season_name: string;
  current_gameweek: number;
  is_season_active: boolean;
}

export default function MatchesScreen() {
  const [seasons, setSeasons] = useState<SeasonListItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<SeasonFixtures | null>(
    null
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | "all">("all");
  const [loading, setLoading] = useState<boolean>(true);

  // ========== Initial Data Fetch ==========
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [seasonRes, teamRes] = await Promise.all([
          axios.get<SeasonListItem[]>(`${BASE_URL}/api/seasons/`),
          axios.get<Team[]>(`${BASE_URL}/api/teams/`),
        ]);

        setSeasons(seasonRes.data);
        setTeams(teamRes.data);

        if (seasonRes.data.length > 0) {
          const firstSeasonId = seasonRes.data[0].id;
          setSelectedSeasonId(firstSeasonId);
          await fetchFixtures(firstSeasonId);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchFixtures = async (seasonId: number) => {
    try {
      setLoading(true);
      const fixturesRes = await axios.get<SeasonFixtures>(
        `${BASE_URL}/api/season-fixtures/?season_id=${seasonId}`
      );
      setSelectedSeason(fixturesRes.data);
    } catch (error) {
      console.error("Error fetching season fixtures:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Filter Rounds ==========
  const filteredRounds: Round[] =
    selectedSeason && Array.isArray(selectedSeason.rounds)
      ? selectedSeason.rounds.map((round: Round) => ({
          ...round,
          matches:
            selectedTeam === "all"
              ? round.matches
              : round.matches.filter(
                  (m: Match) =>
                    m.home_team.id === selectedTeam ||
                    m.away_team.id === selectedTeam
                ),
        }))
      : [];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // ========== UI ==========
  return (
    <View style={styles.container}>
        <View style={{flexDirection:"row", justifyContent:"space-evenly"}}>
      {/* Season Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Season:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSeasonId}
            onValueChange={(value) => {
              setSelectedSeasonId(value);
              fetchFixtures(value);
            }}
            style={{color:"#000000ff"}}
          >
            {seasons.map((s) => (
              <Picker.Item
                key={s.id}
                label={s.season_name}
                value={s.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Team Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Team:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedTeam}
            onValueChange={(value) => setSelectedTeam(value)}
            style={{color:"#000000ff"}}
          >
            <Picker.Item label="All Teams" value="all" />
            {teams.map((team) => (
              <Picker.Item key={team.id} label={team.name} value={team.id} />
            ))}
          </Picker>
        </View>
      </View>
      </View>

      {/* Matches grouped by Round */}
      <FlatList
        data={filteredRounds}
        keyExtractor={(round, index) =>
          round?.round_id?.toString() ?? `round-${index}`
        }
        renderItem={({ item: round }) => (
          <View style={styles.roundContainer}>
            <Text style={styles.roundTitle}>
              Gameweek {round.round_number} ({round.date})
            </Text>

            {round.matches.map((match: Match) => (
              <View key={match.match_id} style={styles.matchCard}>
                <View style={styles.matchRow}>
                  {/* Home Team */}
                  <View style={styles.teamColumn}>
                    <Image
                      source={{ uri: `${BASE_URL}${match.home_team.logo}` }}
                      style={styles.teamLogoLarge}
                    />
                    <Text style={styles.teamName}>{match.home_team.name}</Text>
                  </View>

                  {/* Score */}
                  <Text style={styles.scoreVertical}>
                    {match.home_score}{"\n"}–{"\n"}{match.away_score}
                  </Text>

                  {/* Away Team */}
                  <View style={styles.teamColumn}>
                    <Image
                      source={{ uri: `${BASE_URL}${match.away_team.logo}` }}
                      style={styles.teamLogoLarge}
                    />
                    <Text style={styles.teamName}>{match.away_team.name}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

// ========== Styles ==========
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },

  dropdownContainer: {
    flex: 0.5,
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },

  roundContainer: { marginVertical: 10 },
  roundTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },

  matchCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  teamColumn: {
    alignItems: "center",
    flex: 1,
  },
  teamLogoLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  teamName: {
    textAlign: "center",
    fontSize: 12,
    width: 80,
  },

  scoreVertical: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 20,
    marginHorizontal: 10,
  },
});
