import BidInput from "@/components/BidInput";
import NextRoundPrediction from "@/components/NextRoundPrediction";
import StoryBubble from "@/components/StoryBubble";
import { BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import RefreshableWrapper from "../../components/RefreshableWrapper";
import { useAuth } from "../../context/AuthContext";


type TeamInfo = {
  username: string;
  name: string;
  manager_name: string;
  manager_photo: string;
  logo: string;
  current_balance: number;
};

type SeasonInfo = {
  season: {
    season_name: string;
    current_gameweek: number;
  };
  transfer_window?: {
    name: string;
    season: string;
    year: number;
    deadline?: string;
  };
};

type Bid = {
  id: number;
  player: number;
  player_name: string;
  position: string;
  club_name: string;
  player_photo?: string;
  team_name: string;
  amount: number;
  expires_at: string;
};

type NewsItem = {
  id: number;
  headline: string;
  content: string;
  title_image: string;
  images: string[];
  date_posted: string;
  author: string;
  team_name?: string;
  manager_name?: string;
};

// ✅ Small stateless card (no hooks)
function NewsCard({ item, onPress }: { item: NewsItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        backgroundColor: "#282d6dff",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 6,
      }}
    >
      <ImageBackground
        source={{ uri: item.title_image }}
        style={{ height: 200, justifyContent: "flex-end", backgroundColor: "#ffff"}}
        imageStyle={{ opacity: 0.95, resizeMode: "cover"}}
      >
      </ImageBackground>
      <Text style={{ color: "#ffffffff", fontSize: 18, fontWeight: "700", margin:10}}>
            {item.headline}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
              paddingBottom: 10,
               margin: 10
            }}
          >
            <Text style={{ color: "#ffffffff", fontSize: 12 }}>by {item.author}</Text>
            <Text style={{ color: "#ffffffff", fontSize: 12 }}>
              {new Date(item.date_posted).toLocaleDateString()}
            </Text>
          </View>
    </TouchableOpacity>
  );
}

export default function index() {
  const router = useRouter();
  const { user, fetchWithAuth } = useAuth();

  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<{ [key: number]: number }>({});
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [stories, setStories] = useState([]);
  const [viewedStories, setViewedStories] = useState<number[]>([]);

useEffect(() => {
  (async () => {
    try {
      const stored = await AsyncStorage.getItem("viewedStories");
      if (stored) setViewedStories(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load viewed stories:", err);
    }
  })();
}, []);

  const loadStories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/stories-feed/`);
      if (res.ok) {
        setStories(await res.json());
      }
    } catch (err) {
      console.log("Failed to load stories:", err);
    }
  };

  const loadTeamInfo = async () => {
    if (!user) return setTeamInfo(null);
    const res = await fetchWithAuth(`${BASE_URL}/api/my-team/`);
    if (res.ok) setTeamInfo(await res.json());
  };

  const loadSeasonInfo = async () => {
    const res = await fetch(`${BASE_URL}/api/season-details/`);
    if (res.ok) {
      const data = await res.json();
      setSeasonInfo(data);
      if (data.transfer_window?.deadline) {
        const deadline = new Date(data.transfer_window.deadline);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setDaysLeft(diffDays);
      }
    }
  };

  const loadBids = async () => {
    const res = await fetchWithAuth(`${BASE_URL}/api/active-bids/`);
    if (res.ok) setBids(await res.json());
  };

  const loadNews = async (url?: string) => {
    const apiUrl = url ?? `${BASE_URL}/api/news/`;
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setNews(url ? [...news, ...data.results] : data.results);
        setNextUrl(data.next);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTeamInfo(), loadSeasonInfo(), loadBids(), loadNews(), loadStories()]);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

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
        const next = { ...bidAmount };
        delete next[playerId];
        setBidAmount(next);
        await loadBids();
      } else {
        const errData = await res.json();
        alert(`❌ ${errData.error || "Failed to place bid"}`);
      }
    } catch {
      alert("Network error placing bid");
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };
  const markStoriesAsViewed = async (storyIds: number[]) => {
  const updated = [...new Set([...viewedStories, ...storyIds])];
  setViewedStories(updated);
  await AsyncStorage.setItem("viewedStories", JSON.stringify(updated));
};
  const renderDeadline = () => {
    if (daysLeft === null) return null;
    return (
      <Text
        style={{
          color: daysLeft <= 3 ? "red" : "#000",
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        {daysLeft <= 1
          ? "Final Day of Free Player Transfer"
          : `Ends in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
      </Text>
    );
  };

  if (loading && news.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <RefreshableWrapper onRefresh={loadData}>
        {/* 🌟 Header Section */}
        <LinearGradient
          colors={["#1d296b", "#3949ab"]}
          style={{
            borderRadius: 20,
            margin: 10,
            padding: 20,
            elevation: 5,
            shadowColor: "#000",
          }}
        >
          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center",}}>
            <View>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
                Season: {seasonInfo?.season?.season_name}
              </Text>
              <Text style={{ color: "#cfd8dc" }}>
                Gameweek {seasonInfo?.season?.current_gameweek}
              </Text>
            </View>
            {user && teamInfo ? (
            <View>
              <Image
                source={{ uri: teamInfo.manager_photo }}
                style={{ width: 50, height: 50, borderRadius: 25, marginTop: 5, alignSelf: "flex-end", borderColor: "#3ca9b8ff", borderWidth: 1.5 }}
              />
              <Text style={{ color: "#fff", textAlign: "right" }}>Welcome {teamInfo.manager_name}</Text>
            </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            style={{
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 10,
              alignSelf: "flex-end",
            }}
          >
            <Text style={{ color: "#1d296b", fontWeight: "600" }}>Log In</Text>
          </TouchableOpacity>
          )}
          </View>
        </LinearGradient>
        {/* ✅ Stories Section */}
        {stories.length > 0 && (
        <View style={{ paddingVertical: 10 }}>
          <Text style={{ marginLeft: 15, marginBottom: 8, fontSize: 16, fontWeight: "700" }}>
            Stories
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 10 }}>
            {stories.map((entry) => {
              const isViewed = entry.stories.every((s: any) => viewedStories.includes(s.id));

              return (
                <StoryBubble
                  key={entry.user.id}
                  entry={entry}
                  isViewed={isViewed}
                  onPress={() => {
                    router.push({
                      pathname: "/story-viewer",
                      params: { userId: entry.user.id },
                    });
                    const storyIds = entry.stories.map((s: any) => s.id);
                    markStoriesAsViewed(storyIds);
                  }}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
        {/* 🪩 Transfer Window Banner */}
        {seasonInfo?.transfer_window && (
          <ImageBackground
            source={require("../../assets/images/tw_banner.png")}
            style={{
              width: "98%",
              height: 160,
              // alignSelf: "center",
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 10,
              marginRight: 10,
              marginBottom: 20,
            }}
            imageStyle={{ borderRadius: 20 }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>
              Free Player Transfer Window
            </Text>
            <Text style={{ fontSize: 18, color: "#333" }}>
              {seasonInfo.transfer_window.name}
            </Text>
            {renderDeadline()}
            {user && teamInfo && (
              <TouchableOpacity
                onPress={() => router.push("/free-agent-screen")}
                style={{
                  backgroundColor: "#2563eb",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Bid A Player
                </Text>
              </TouchableOpacity>
            )}
          </ImageBackground>
        )}

        {/* ⚔️ Running Bids */}
        {bids.length > 0 && (
          <View style={{ margin: 10 }}>
            <LinearGradient
              colors={["#4a148c", "#7b1fa2"]}
              style={{
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Running Bids
              </Text>
            </LinearGradient>

            {bids.map((item) => {
              const minBid = Number((item.amount + 0.1).toFixed(1));
              return (
                <ImageBackground
                  key={item.id}
                  source={{
                    uri: `${BASE_URL}/media/bid_cover.jpg`,
                  }}
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 12,
                    overflow: "hidden",
                  }}
                  imageStyle={{ borderRadius: 14, opacity:0.6}}
                >
                  <View style={{ flexDirection: "row" }}>
                    <Image
                      source={{
                        uri:
                          item.player_photo ||
                          `${BASE_URL}/media/default.jpeg`,
                      }}
                      style={{
                        width: 70,
                        height: 130,
                        borderRadius: 5,
                        marginRight: 12,
                      }}
                    />
                    <View style={{ flex: 1}}>
                      <Text style={{ fontWeight: "700", fontSize: 16, color: "#000000ff" }}>
                        {item.player_name}
                      </Text>
                      <Text>
                        {item.amount}M by {item.team_name}
                      </Text>
                      <Text>
                        Club: {item.club_name} || Position: {item.position}
                      </Text>
                      <Text style={{ color: "#da3d3dff" }}>
                        ⏳ {formatExpiry(item.expires_at)}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          marginTop: 5,
                          alignItems: "center",
                        }}
                      >
                        <BidInput
                          minBid={minBid}
                          value={bidAmount[item.player] ?? null}
                          onChange={(val) =>
                            setBidAmount((prev) => ({ ...prev, [item.player]: val }))
                          }
                        />
                        <TouchableOpacity
                          onPress={() => {
                            const bidValue = bidAmount[item.player] ?? minBid;
                            Alert.alert(
                              "Confirm Bid",
                              `Are you sure you want to place a bid of ${bidValue}M for ${item.player_name}?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Yes",
                                  onPress: () => placeBid(item.player, bidValue),
                                },
                              ]
                            );
                          }}
                          style={{
                            backgroundColor: "#2563eb",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 18 }}>Place Bid</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              );
            })}
          </View>
        )}
        {/* ✅ Prediction Mini-Game */}
        <View style={{ marginBottom: 20 }}>
          <View><NextRoundPrediction/></View>
        </View>
        {/* 📰 News Feed */}
        <View style={{ marginHorizontal: 10 }}>
          <LinearGradient
            colors={["#d81b60", "#ff4081"]}
            style={{
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
              News
            </Text>
          </LinearGradient>

          {news.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/news/[id]",
                  params: {
                    id: item.id,
                  },
                })
              }
            />
          ))}

          {nextUrl && (
            <TouchableOpacity
              onPress={() => loadNews(nextUrl)}
              style={{
                backgroundColor: "#377eb8",
                height: 50,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Show More News
              </Text>
            </TouchableOpacity>
          )}
        </View>
    </RefreshableWrapper>
  );
}
