import { BASE_URL } from "@/config";
import { useThemeColors } from "@/theme/colors";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// =========================================================
// TYPES
// =========================================================

interface Match {
  id: number;
  home_team: number;
  away_team: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  round: {
    round_number: number;
    date: string | null;
  };
}

interface Season {
  id: number;
  season_name: string;
}

interface SeasonStat {
  wins: number;
  draws: number;
  losses: number;
  win_percentage: number;
}

interface Opponent {
  id: string;
  name: string;
}

// =========================================================
// COMPONENT
// =========================================================

export default function MatchesTab({ teamId }: { teamId: string }) {
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [selectedSeason, setSelectedSeason] =
    useState<number | null>(null);

  const [opponents, setOpponents] = useState<Opponent[]>([
    {
      id: "all",
      name: "All Opponents",
    },
  ]);

  const [selectedOpponent, setSelectedOpponent] =
    useState<string>("all");

  const [stats, setStats] = useState<SeasonStat | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);

  const [loading, setLoading] = useState(false);

  const colors = useThemeColors();

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchSeasons();
  }, [teamId]);

  // =========================================================
  // FETCH MATCHES WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    if (selectedSeason !== null) {
      fetchSeasonData(
        selectedSeason,
        selectedOpponent
      );
    }
  }, [selectedSeason, selectedOpponent]);

  // =========================================================
  // FETCH SEASONS
  // =========================================================

  const fetchSeasons = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/api/seasons/`
      );

      if (!res.ok) {
        throw new Error(
          `Failed to fetch seasons: ${res.status}`
        );
      }

      const data: Season[] = await res.json();

      setSeasons(data);

      if (data.length > 0) {
        const firstSeasonId = data[0].id;

        setSelectedSeason(firstSeasonId);

        // Important:
        // Reset opponent whenever team/season changes.
        setSelectedOpponent("all");
      } else {
        setSelectedSeason(null);
      }
    } catch (err) {
      console.error(
        "Error fetching seasons:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // BUILD OPPONENT LIST
  // =========================================================

  const buildOpponentList = (
    seasonMatches: Match[]
  ): Opponent[] => {
    const opponentMap = new Map<
      number,
      string
    >();

    for (const match of seasonMatches) {
      const isHome =
        match.home_team === Number(teamId);

      const opponentId = isHome
        ? match.away_team
        : match.home_team;

      const opponentName = isHome
        ? match.away_team_name
        : match.home_team_name;

      if (
        opponentId !== null &&
        opponentId !== undefined &&
        opponentName
      ) {
        opponentMap.set(
          opponentId,
          opponentName
        );
      }
    }

    return [
      {
        id: "all",
        name: "All Opponents",
      },

      ...Array.from(opponentMap.entries())
        .sort((a, b) =>
          a[1].localeCompare(b[1])
        )
        .map(([id, name]) => ({
          id: String(id),
          name,
        })),
    ];
  };

  // =========================================================
  // FETCH SEASON DATA
  // =========================================================

  const fetchSeasonData = async (
    seasonId: number,
    opponentId: string
  ) => {
    try {
      setLoading(true);

      // -----------------------------------------------------
      // IMPORTANT:
      // Always fetch the complete season first.
      //
      // This allows us to build the COMPLETE opponent list.
      // -----------------------------------------------------

      const allMatchesUrl =
        `${BASE_URL}/api/season/${seasonId}/team/${teamId}/details/`;

      const allMatchesRes = await fetch(
        allMatchesUrl
      );

      if (!allMatchesRes.ok) {
        throw new Error(
          `Failed to fetch season data: ${allMatchesRes.status}`
        );
      }

      const allSeasonData =
        await allMatchesRes.json();

      // -----------------------------------------------------
      // Build opponent list ONLY from unfiltered data.
      //
      // This is the important fix.
      // -----------------------------------------------------

      const completeOpponentList =
        buildOpponentList(
          allSeasonData.matches || []
        );

      setOpponents(
        completeOpponentList
      );

      // -----------------------------------------------------
      // No opponent selected
      // -----------------------------------------------------

      if (
        opponentId === "all"
      ) {
        setStats(
          allSeasonData.stats
        );

        setMatches(
          allSeasonData.matches || []
        );

        return;
      }

      // -----------------------------------------------------
      // Specific opponent selected
      // -----------------------------------------------------

      const filteredUrl =
        `${BASE_URL}/api/season/${seasonId}/team/${teamId}/details/` +
        `?opponent_team_id=${opponentId}`;

      const filteredRes = await fetch(
        filteredUrl
      );

      if (!filteredRes.ok) {
        throw new Error(
          `Failed to fetch filtered matches: ${filteredRes.status}`
        );
      }

      const filteredData =
        await filteredRes.json();

      setStats(
        filteredData.stats
      );

      setMatches(
        filteredData.matches || []
      );
    } catch (err) {
      console.error(
        "Error fetching matches:",
        err
      );

      setStats(null);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HANDLE SEASON CHANGE
  // =========================================================

  const handleSeasonChange = (
    seasonId: number
  ) => {
    // Reset opponent first.
    setSelectedOpponent("all");

    // Change season.
    setSelectedSeason(seasonId);
  };

  // =========================================================
  // HANDLE OPPONENT CHANGE
  // =========================================================

  const handleOpponentChange = (
    opponentId: string
  ) => {
    setSelectedOpponent(opponentId);
  };

  // =========================================================
  // MATCH CARD COLOR
  // =========================================================

  const getMatchColor = (
    match: Match
  ): string => {
    // Upcoming / undeclared match
    if (
      match.home_score === null ||
      match.away_score === null
    ) {
      return "#f9f9f9";
    }

    const isHome =
      match.home_team === Number(teamId);

    const myScore = isHome
      ? match.home_score
      : match.away_score;

    const opponentScore = isHome
      ? match.away_score
      : match.home_score;

    if (myScore > opponentScore) {
      return "#bdf4b4";
    }

    if (myScore < opponentScore) {
      return "#f7c0c0";
    }

    return "#e4e4e4";
  };

  // =========================================================
  // RENDER MATCH
  // =========================================================

  const renderMatch = ({
    item,
  }: {
    item: Match;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.matchCard,
        {
          backgroundColor:
            getMatchColor(item),
        },
      ]}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.roundText}>
          🏆 GW
          {item.round?.round_number ?? "-"}
        </Text>

        <Text style={styles.dateText}>
          📅{" "}
          {item.round?.date
            ? item.round.date
            : "No Date"}
        </Text>
      </View>

      <Text style={styles.matchText}>
        {item.home_team_name}{" "}

        <Text style={styles.scoreText}>
          {item.home_score ?? "-"} :{" "}
          {item.away_score ?? "-"}
        </Text>{" "}

        {item.away_team_name}
      </Text>
    </TouchableOpacity>
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <View style={styles.container}>
      {/* =====================================================
          TITLE
      ===================================================== */}

      <Text style={styles.title}>
        Match History
      </Text>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <View style={styles.filtersRow}>
        {/* ---------------------------------------------------
            SEASON
        --------------------------------------------------- */}

        <View style={styles.filterColumn}>
          <Text style={styles.label}>
            Select Season
          </Text>

          <View style={styles.pickerBox}>
            <Picker
              selectedValue={
                selectedSeason
              }
              onValueChange={
                handleSeasonChange
              }
              style={styles.picker}
              dropdownIconColor="#000"
              prompt="Select Season"
            >
              {seasons.map((season) => (
                <Picker.Item
                  key={season.id}
                  label={
                    season.season_name
                  }
                  value={season.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* ---------------------------------------------------
            OPPONENT
        --------------------------------------------------- */}

        <View style={styles.filterColumn}>
          <Text style={styles.label}>
            Filter by Opponent
          </Text>

          <View style={styles.pickerBox}>
            <Picker
              selectedValue={
                selectedOpponent
              }
              onValueChange={
                handleOpponentChange
              }
              style={styles.picker}
              dropdownIconColor="#000"
              prompt="Select Team"
            >
              {opponents.map(
                (opponent) => (
                  <Picker.Item
                    key={opponent.id}
                    label={
                      opponent.name
                    }
                    value={
                      opponent.id
                    }
                  />
                )
              )}
            </Picker>
          </View>
        </View>
      </View>

      {/* =====================================================
          STATS
      ===================================================== */}

      {stats && (
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>
            📊 Team Stats
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              Wins: {stats.wins}
            </Text>

            <Text style={styles.statText}>
              Draws: {stats.draws}
            </Text>

            <Text style={styles.statText}>
              Losses: {stats.losses}
            </Text>

            <Text style={styles.statText}>
              Win %:{" "}
              {stats.win_percentage?.toFixed(
                1
              )}
              %
            </Text>
          </View>
        </View>
      )}

      {/* =====================================================
          MATCHES
      ===================================================== */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#007aff"
          />
        </View>
      ) : matches.length > 0 ? (
        <FlatList
          data={matches}
          keyExtractor={(item) =>
            item.id.toString()
          }
          renderItem={renderMatch}
          contentContainerStyle={{
            paddingBottom: 80,
          }}
          showsVerticalScrollIndicator={
            false
          }
        />
      ) : (
        <Text style={styles.noMatchText}>
          No matches found.
        </Text>
      )}
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fafafa",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#222",
  },

  // ========================================================
  // FILTERS
  // ========================================================

  filtersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    marginBottom: 8,
  },

  filterColumn: {
    width: "45%",
  },

  label: {
    fontWeight: "600",
    marginTop: 8,
    color: "#555",
    marginBottom: 4,
  },

  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: "100%",
    overflow: "hidden",
  },

  picker: {
    height: 50,
    color: "#000",
  },

  // ========================================================
  // LOADING
  // ========================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ========================================================
  // STATS
  // ========================================================

  statsBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statText: {
    width: "48%",
    fontSize: 15,
    marginVertical: 2,
  },

  // ========================================================
  // MATCH CARD
  // ========================================================

  matchCard: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  roundText: {
    fontWeight: "700",
    color: "#333",
  },

  dateText: {
    fontWeight: "500",
    color: "#666",
  },

  matchText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    color: "#222",
  },

  scoreText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000",
  },

  noMatchText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
});