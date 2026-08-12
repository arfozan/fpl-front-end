
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

  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);

  // --------------------------------------------------
  // LOAD STORIES
  // --------------------------------------------------

  const loadStories = async (id: string) => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/stories-feed/`);

      if (!res.ok) {
        console.log("Story feed failed:", res.status);
        return;
      }

      const feed = await res.json();

      console.log("STORY FEED:", JSON.stringify(feed, null, 2));
      console.log("LOOKING FOR USER:", id);

      const entry = feed.find(
        (item: any) => String(item.user.id) === String(id)
      );

      if (!entry) {
        console.log("No story entry found for user:", id);
        return;
      }

      const allStories = entry.groups
        .filter((group: any) => group.stories?.length > 0)
        .flatMap((group: any) => group.stories);

      console.log("FOUND STORIES:", allStories.length);

      setStories(allStories);
      setCurrentIndex(0);
    } catch (error) {
      console.log("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      console.log("No userId received");
      return;
    }

    console.log("USER ID:", userId);

    loadStories(userId);
  }, [userId]);

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((index) => index + 1);
    } else {
      router.back();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  };

  // --------------------------------------------------
  // PROGRESS
  // --------------------------------------------------

  const startProgress = (duration: number) => {
    progress.stopAnimation();
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
  };

  // --------------------------------------------------
  // CURRENT STORY
  // --------------------------------------------------

  useEffect(() => {
    if (!stories.length) return;

    const story = stories[currentIndex];

    if (!story) return;

    console.log("CURRENT STORY:", story.id);
    console.log("MEDIA:", story.media);

    if (!story.media) {
      startProgress(5000);
      return;
    }

    const media = String(story.media).toLowerCase();

    const isVideo =
      media.endsWith(".mp4") ||
      media.endsWith(".mov") ||
      media.endsWith(".m4v");

    if (!isVideo) {
      startProgress(5000);
    }
  }, [stories, currentIndex]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  // --------------------------------------------------
  // NO STORIES
  // --------------------------------------------------

  if (stories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No stories found.</Text>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const story = stories[currentIndex];

  const hasMedia = !!story.media;

  const media = hasMedia
    ? String(story.media).toLowerCase()
    : "";

  const isVideo =
    hasMedia &&
    (
      media.endsWith(".mp4") ||
      media.endsWith(".mov") ||
      media.endsWith(".m4v")
    );

  const mediaUrl = hasMedia
    ? `${BASE_URL}${story.media}`
    : null;

  console.log("RENDER STORY:", story.id);
  console.log("MEDIA URL:", mediaUrl);
  console.log("IS VIDEO:", isVideo);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
        translucent
        backgroundColor="transparent"
      />

      {/* STORY MEDIA */}
      <View style={styles.mediaWrapper}>
        {hasMedia ? (
          isVideo ? (
            <Video
              ref={videoRef}
              source={{
                uri: mediaUrl!,
              }}
              style={styles.media}
              resizeMode="contain"
              shouldPlay
              isLooping={false}
              onLoad={(status) => {
                if (
                  status &&
                  "durationMillis" in status &&
                  typeof status.durationMillis === "number"
                ) {
                  console.log(
                    "VIDEO DURATION:",
                    status.durationMillis
                  );

                  startProgress(status.durationMillis);
                }
              }}
              onPlaybackStatusUpdate={(status) => {
                if (
                  "didJustFinish" in status &&
                  status.didJustFinish
                ) {
                  nextStory();
                }
              }}
              onError={(error) => {
                console.log("VIDEO ERROR:", error);
              }}
            />
          ) : (
            <Image
              source={{
                uri: mediaUrl!,
              }}
              style={styles.media}
              resizeMode="contain"
              onLoad={() => {
                console.log(
                  "IMAGE LOADED:",
                  mediaUrl
                );
              }}
              onError={(error) => {
                console.log(
                  "IMAGE ERROR:",
                  error.nativeEvent
                );
              }}
            />
          )
        ) : (
          <View
            style={[
              styles.textStory,
              {
                backgroundColor:
                  story.bg_color || "#000",
              },
            ]}
          >
            <Text style={styles.storyText}>
              {story.text}
            </Text>
          </View>
        )}
      </View>

      {/* PROGRESS BARS */}
      <View style={styles.progressContainer}>
        {stories.map((_: any, index: number) => (
          <View
            key={index}
            style={styles.progressBarBackground}
          >
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
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

      {/* CLOSE BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* LEFT / RIGHT TAP AREAS */}
      <View style={styles.touchContainer}>
        <Pressable
          style={styles.leftTouch}
          onPress={prevStory}
        />

        <Pressable
          style={styles.rightTouch}
          onPress={nextStory}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#fff",
    fontSize: 18,
  },

  mediaWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  media: {
    width,
    height,
  },

  textStory: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  storyText: {
    color: "#fff",
    fontSize: 28,
    textAlign: "center",
  },

  progressContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 8,
    zIndex: 100,
    elevation: 100,
  },

  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    marginHorizontal: 2,
  },

  progressBar: {
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 3,
  },

  header: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 200,
    elevation: 200,
  },

  closeIcon: {
    fontSize: 26,
    color: "#fff",
  },

  closeButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#444",
    borderRadius: 10,
  },

  closeText: {
    color: "#fff",
  },

  touchContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    flexDirection: "row",
    zIndex: 50,
  },

  leftTouch: {
    flex: 1,
  },

  rightTouch: {
    flex: 1,
  },
});