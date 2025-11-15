import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedSeasonName, setSelectedSeasonName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter(); // ✅ use router for navigation

  const fetchSeasons = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/seasons/`);
      setSeasons(res.data);
      const active = res.data.find((s: Season) => s.is_season_active) || res.data[0];
      setSelectedSeasonId(active.id);
      setSelectedSeasonName(active.season_name);
    } catch (err) {
      console.error('Error fetching seasons:', err);
    }
  };

  const fetchLeagueTable = async (seasonId: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/league-table/?season_id=${seasonId}`);
      setSeasonData(res.data);
    } catch (err) {
      console.error('Error fetching table:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) fetchLeagueTable(selectedSeasonId);
  }, [selectedSeasonId]);

  const handleTeamPress = (team: LeagueData) => {
    // 👇 navigate using the team id or team name if id isn't available
    if (team.id) {
      router.push(`/team/${team.id}`);
    } else {
      // fallback if your API doesn't include IDs yet
      router.push({
        pathname: `/team/[id]`,
        params: { id: encodeURIComponent(team.team) },
      });
    }
  };

  const renderItem = ({ item, index }: { item: LeagueData; index: number }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff' },
      ]}
      onPress={() => handleTeamPress(item)}
    >
      <Text style={styles.rank}>{item.rank}</Text>
      <View style={styles.teamCell}>
        <Image source={{ uri: `${BASE_URL}/api${item.logo}` }} style={styles.teamLogo} />
        <Text style={styles.teamName}>{item.team}</Text>
      </View>
      <Text style={styles.cell}>{item.wins}</Text>
      <Text style={styles.cell}>{item.draws}</Text>
      <Text style={styles.cell}>{item.losses}</Text>
      <Text style={[styles.cell, styles.points]}>{item.points}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏆 League Table</Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSeasonId}
          prompt='Select Season'
          dropdownIconColor='#000000ff'
          onValueChange={(value) => {
            const season = seasons.find((s) => s.id === value);
            if (season) {
              setSelectedSeasonId(season.id);
              setSelectedSeasonName(season.season_name);
            }
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

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { width: 40 }]}>#</Text>
            <Text style={[styles.headerText, { flex: 1, textAlign: 'left' }]}>
              Team
            </Text>
            <Text style={styles.headerText}>W</Text>
            <Text style={styles.headerText}>D</Text>
            <Text style={styles.headerText}>L</Text>
            <Text style={[styles.headerText, { color: '#ffffffff' }]}>Pts</Text>
          </View>

          <FlatList
            data={seasonData?.table || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.rank.toString()}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginVertical: 10, color: '#222' },
  pickerContainer: {
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: { height: 50, width: '100%', color: '#000000ff'},
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerText: { color: 'white', fontWeight: 'bold', textAlign: 'center', width: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: { width: 40, textAlign: 'center', fontWeight: 'bold', color: '#333' },
  teamCell: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  teamLogo: { width: 26, height: 26, marginRight: 8 },
  teamName: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  cell: { width: 40, textAlign: 'center', fontSize: 15, color: '#444' },
  points: { fontWeight: 'bold', color: '#007AFF' },
});

export default LeagueTableScreen;
