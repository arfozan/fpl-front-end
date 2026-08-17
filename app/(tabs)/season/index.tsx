import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../../../config";

interface LeagueData {
  id?: number;
  rank: number;
  team: string;
  logo: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

interface Season {
  id: number;
  season_name: string;
  current_gameweek: number;
  is_season_active: boolean;
}

interface SeasonData {
  season: string;
  table: LeagueData[];
}

const LeagueTableScreen = () => {
  const router = useRouter();

  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // --------------------------------------------------
  // Fetch seasons
  // --------------------------------------------------

  const fetchSeasons = async () => {
    try {
      const res = await axios.get<Season[]>(`${BASE_URL}/api/seasons/`);

      const data = res.data;

      setSeasons(data);

      if (data.length === 0) {
        setSelectedSeasonId(null);
        setSeasonData(null);
        return;
      }

      /*
       * Keep the currently selected season if it still exists.
       * Otherwise select the active season, or first season.
       */
      setSelectedSeasonId((currentId) => {
        const currentSeasonExists = currentId
          ? data.some((season) => season.id === currentId)
          : false;

        if (currentSeasonExists) {
          return currentId;
        }

        const activeSeason =
          data.find((season) => season.is_season_active) || data[0];

        return activeSeason.id;
      });
    } catch (err) {
      console.error("Error fetching seasons:", err);
    }
  };

  // --------------------------------------------------
  // Fetch league table
  // --------------------------------------------------

  const fetchLeagueTable = async (seasonId: number) => {
    try {
      setLoading(true);

      const res = await axios.get<SeasonData>(
        `${BASE_URL}/api/league-table/?season_id=${seasonId}`
      );

      setSeasonData(res.data);
    } catch (err) {
      console.error("Error fetching table:", err);
      setSeasonData(null);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Refresh whenever Seasons tab gets focus
  // --------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshScreen = async () => {
        try {
          /*
           * First refresh the season list.
           * This also makes sure the current season still exists.
           */
          await fetchSeasons();
        } catch (error) {
          console.error("Error refreshing season screen:", error);
        }
      };

      refreshScreen();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // --------------------------------------------------
  // Fetch table whenever selected season changes
  // --------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      if (selectedSeasonId === null) {
        return;
      }

      fetchLeagueTable(selectedSeasonId);
    }, [selectedSeasonId])
  );

  // --------------------------------------------------
  // Team press
  // --------------------------------------------------

  const handleTeamPress = (team: LeagueData) => {
    if (team.id) {
      router.push(`/team/${team.id}`);
    } else {
      router.push({
        pathname: "/team/[id]",
        params: {
          id: encodeURIComponent(team.team),
        },
      });
    }
  };

  // --------------------------------------------------
  // Render team
  // --------------------------------------------------

  const renderItem = ({
    item,
    index,
  }: {
    item: LeagueData;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
        },
      ]}
      onPress={() => handleTeamPress(item)}
    >
      <Text style={styles.rank}>{item.rank}</Text>

      <View style={styles.teamCell}>
        <Image
          source={{
            uri: `${BASE_URL}/api${item.logo}`,
          }}
          style={styles.teamLogo}
        />

        <Text
          style={styles.teamName}
          numberOfLines={1}
        >
          {item.team}
        </Text>
      </View>

      <Text style={styles.cell}>{item.wins}</Text>

      <Text style={styles.cell}>{item.draws}</Text>

      <Text style={styles.cell}>{item.losses}</Text>

      <Text style={[styles.cell, styles.points]}>
        {item.points}
      </Text>
    </TouchableOpacity>
  );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏆 League Table</Text>

      {/* Season Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSeasonId}
          prompt="Select Season"
          dropdownIconColor="#000"
          onValueChange={(value) => {
            setSelectedSeasonId(value);
          }}
          style={styles.picker}
        >
          {seasons.map((season) => (
            <Picker.Item
              key={season.id}
              label={season.season_name}
              value={season.id}
            />
          ))}
        </Picker>
      </View>

      {/* Loading */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.headerText,
                {
                  width: 40,
                },
              ]}
            >
              #
            </Text>

            <Text
              style={[
                styles.headerText,
                {
                  flex: 1,
                  textAlign: "left",
                },
              ]}
            >
              Team
            </Text>

            <Text style={styles.headerText}>W</Text>

            <Text style={styles.headerText}>D</Text>

            <Text style={styles.headerText}>L</Text>

            <Text
              style={[
                styles.headerText,
                {
                  color: "#fff",
                },
              ]}
            >
              Pts
            </Text>
          </View>

          {/* Table */}
          <FlatList
            data={seasonData?.table || []}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              item.id?.toString() ?? `${item.rank}-${index}`
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 30,
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    padding: 16,
  },

  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#222",
  },

  pickerContainer: {
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 2,
    marginBottom: 15,
    overflow: "hidden",
  },

  picker: {
    height: 50,
    width: "100%",
    color: "#000",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  headerText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    width: 40,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  rank: {
    width: 40,
    textAlign: "center",
    fontWeight: "bold",
    color: "#333",
  },

  teamCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  teamLogo: {
    width: 26,
    height: 26,
    marginRight: 8,
  },

  teamName: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
  },

  cell: {
    width: 40,
    textAlign: "center",
    fontSize: 15,
    color: "#444",
  },

  points: {
    fontWeight: "bold",
    color: "#007AFF",
  },
});

export default LeagueTableScreen;