import { BASE_URL } from "@/config";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BidInput from "../components/BidInput";
import { useAuth } from "../context/AuthContext";

export default function FreeAgents() {
  const { fetchWithAuth } = useAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<{ [key: number]: number }>({});
  const [search, setSearch] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");

  const loadPlayers = async () => {
    try {
      const [playersRes, bidsRes] = await Promise.all([
        fetchWithAuth(`${BASE_URL}/api/free-agents/`),
        fetchWithAuth(`${BASE_URL}/api/active-bids/`),
      ]);

      if (playersRes.ok && bidsRes.ok) {
        const playersData = await playersRes.json();
        const bidsData = await bidsRes.json();

        // Map bids by player_id
        const bidMap: Record<number, any> = {};
        bidsData.forEach((b: any) => {
          bidMap[b.player] = b;
        });

        // Merge bids into players
        const merged = playersData.map((p: any) => ({
          ...p,
          current_bid: bidMap[p.id]?.amount || null,
          current_bid_team: bidMap[p.id]?.team_name || null,
        }));

        setPlayers(merged);
        setFilteredPlayers(merged);
      } else {
        console.error("Failed to fetch players/bids");
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // Filter + Sort when search or position changes
  useEffect(() => {
    let data = [...players];

    // Filter by position
    if (selectedPosition !== "all") {
      data = data.filter(
        (p) => p.position.toLowerCase() === selectedPosition.toLowerCase()
      );
    }

    // Filter by search text
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.full_name.toLowerCase().includes(lowerSearch) ||
          p.position.toLowerCase().includes(lowerSearch) ||
          (p.club_name && p.club_name.toLowerCase().includes(lowerSearch))
      );
    }

    // Sort by points (highest → lowest)
    data.sort((a, b) => (b.points || 0) - (a.points || 0));

    setFilteredPlayers(data);
  }, [search, players, selectedPosition]);

  const placeBid = async (playerId: number, minBid: number) => {
    const amount = bidAmount[playerId] ?? minBid;
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/bids/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, amount }),
      });

      if (res.ok) {
        alert("✅ Bid placed successfully!");
        setBidAmount((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
        await loadPlayers();
      } else {
        const errData = await res.json();
        alert(`❌ ${errData.error || "Failed to place bid"}`);
      }
    } catch {
      alert("Network error placing bid");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search players..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Position Filter Buttons */}
      <View style={styles.filterRow}>
        {["all", "GK", "DF", "MF", "FW"].map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[
              styles.filterButton,
              selectedPosition === pos.toLowerCase() && styles.activeFilter,
            ]}
            onPress={() => setSelectedPosition(pos.toLowerCase())}
          >
            <Text
              style={[
                styles.filterText,
                selectedPosition === pos.toLowerCase() && styles.activeFilterText,
              ]}
            >
              {pos.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const minBid = item.min_bid ?? item.base_price;

          return (
            <View style={styles.card}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text
                  style={[styles.playerName, { flexShrink: 1 }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.full_name}
                </Text>

                <Text>Position: {item.position}</Text>
                <Text>Club: {item.club_name}</Text>
                <Text>Base: {item.base_price}M</Text>
                <Text>Points: {item.points}</Text>

                <Text style={{ marginTop: 4 }}>
                  Current Bid:{" "}
                  {item.current_bid ? `${item.current_bid}M` : "No bids yet"}
                  {item.current_bid_team ? ` by ${item.current_bid_team}` : ""}
                </Text>

                <BidInput
                  minBid={minBid}
                  value={bidAmount[item.id] ?? null}
                  onChange={(val) =>
                    setBidAmount((prev) => ({ ...prev, [item.id]: val }))
                  }
                />
              </View>
              <View
                style={{
                  width: 120,
                  height: 200,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: `${BASE_URL}${item.photo}` }}
                  style={{ width: "100%", height: "100%", borderRadius: 5 }}
                  resizeMode="cover"
                />
              </View>
            </View>

  <Button title="Place Bid" onPress={() => placeBid(item.id, minBid)} />
</View>

          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeFilter: {
    backgroundColor: "#1d296bff",
    borderColor: "#1d296bff",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  playerName: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
});