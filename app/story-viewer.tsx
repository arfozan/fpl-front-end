import { BASE_URL } from "@/config";
import { Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
export default function StoryViewer() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const videoRef = useRef<Video | null>(null);

  // Load stories from feed
  const loadStories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/stories-feed/`);
      if (!res.ok) return;

      const feed = await res.json();
      const entry = feed.find((item: any) => item.user.id == userId);

      if (entry) setStories(entry.stories);
    } catch (err) {
      console.log("Error loading stories:", err);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.back();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      router.back();
    }
  };

  // Start progress bar animation
  const startProgress = (duration: number) => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) nextStory();
    });
  };

  // Handle progress for text & images
  useEffect(() => {
    if (stories.length === 0) return;

    const story = stories[currentIndex];

    // Text-only story
    if (!story.media) {
      startProgress(5000);
      return;
    }

    // Lowercase once safely
    const media = story.media.toLowerCase();
    const isVideo = media.endsWith(".mp4") || media.endsWith(".mov");

    // Images get fixed 5s duration
    if (!isVideo) {
      startProgress(5000);
    }
  }, [stories, currentIndex]);

  if (stories.length === 0) return null;

  const story = stories[currentIndex];

  // Safe checks
  const hasMedia = !!story.media;
  const media = hasMedia ? story.media.toLowerCase() : "";
  const isVideo = hasMedia && (media.endsWith(".mp4") || media.endsWith(".mov"));

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent"/>
      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width:
                    i < currentIndex
                      ? "100%"
                      : i === currentIndex
                      ? progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        })
                      : "0%",
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Tap zones */}
      <View style={styles.touchContainer}>
        <Pressable style={{ flex: 1 }} onPress={prevStory} />
        <Pressable style={{ flex: 1 }} onPress={nextStory} />
      </View>

      {/* Story Content */}
      <View style={styles.mediaWrapper}>
        {hasMedia ? (
          isVideo ? (
            <Video
              ref={videoRef}
              source={{ uri: `${BASE_URL}${story.media}` }}
              resizeMode="contain"
              style={{ width, height, backgroundColor: "#000" }}
              shouldPlay
              onLoad={(status) => {
                if (
                  status &&
                  "durationMillis" in status &&
                  typeof status.durationMillis === "number"
                ) {
                  startProgress(status.durationMillis);
                }
              }}
              onPlaybackStatusUpdate={(status) => {
                if ("didJustFinish" in status && status.didJustFinish) {
                  nextStory();
                }
              }}
            />
          ) : (
            <Image
              source={{ uri: `${BASE_URL}${story.media}` }}
              style={{ width, height, resizeMode: "contain", backgroundColor: "#000" }}
            />
          )
        ) : (
          // ✅ Text-only story
          <View
            style={{
              width,
              height,
              backgroundColor: story.bg_color || "#000",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 28, color: "#fff", textAlign: "center" }}>
              {story.text}
            </Text>
          </View>
        )}
      </View>

      {/* Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 26, color: "#fff" }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  mediaWrapper: { position: "absolute", width, height, top: 0, left: 0 },
  header: { position: "absolute", top: 40, left: 20, zIndex: 50, elevation: 50 },
  progressContainer: {
    position: "absolute",
    top: 20,
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 8,
    zIndex: 20,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    height: 3,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  progressBar: { height: 3, backgroundColor: "#fff", borderRadius: 3 },
  touchContainer: {
    flexDirection: "row",
    position: "absolute",
    width,
    height,
    zIndex: 30,
  },
});
