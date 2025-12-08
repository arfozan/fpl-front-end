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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  // progress value
  const progress = useRef(new Animated.Value(0)).current;
  // keep reference to the running Animated.timing so we can stop it
  const progressAnimRef = useRef<any>(null);

  // video ref
  const videoRef = useRef<Video | null>(null);
  // playing state: only true when current story is active video
  const [playing, setPlaying] = useState(false);

  // description UI
  const descOpacity = useRef(new Animated.Value(0)).current;
  const [showDesc, setShowDesc] = useState(false);
  const descTimerRef = useRef<any>(null);

  // Load Stories
  const loadStories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/stories-feed/`);
      if (!res.ok) return;

      const feed = await res.json();
      const entry = feed.find((item: any) => item.user.id == userId);

      if (entry) {
        setUserInfo(entry.user);
        setStories(entry.stories);
      }
    } catch (err) {
      console.log("Error loading stories:", err);
    }
  };

  useEffect(() => {
    loadStories();

    // cleanup on unmount
    return () => {
      // stop any animation
      progressAnimRef.current?.stop?.();
      // clear desc timer
      if (descTimerRef.current) clearTimeout(descTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: stop & reset progress animation
  const stopProgress = () => {
    try {
      progressAnimRef.current?.stop?.();
    } catch (e) {
      // ignore
    }
    progress.setValue(0);
    progressAnimRef.current = null;
  };

  // Start progress for given duration (ms)
  const startProgress = (duration: number) => {
    // ensure any previous anim stopped
    stopProgress();

    // set to 0 then animate to 1
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    progressAnimRef.current = anim;
    anim.start(({ finished }) => {
      // only advance if finished naturally
      if (finished) {
        goNextStory();
      }
    });
  };

  // safe navigation helpers that stop progress and handle video reset
  const goNextStory = async () => {
    // hide description & clear timer
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }
    setShowDesc(false);
    // stop animation & pause current video
    stopProgress();
    if (videoRef.current) {
      try {
        await videoRef.current.pauseAsync();
        // reset position for next time (optional)
        await videoRef.current.setPositionAsync(0);
      } catch (e) {
        // ignore if video not loaded
      }
    }

    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      router.back();
    }
  };

  const goPrevStory = async () => {
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }
    setShowDesc(false);
    stopProgress();
    if (videoRef.current) {
      try {
        await videoRef.current.pauseAsync();
        await videoRef.current.setPositionAsync(0);
      } catch (e) {}
    }

    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    } else {
      router.back();
    }
  };

  // when currentIndex changes, reset progress and set playing state
  useEffect(() => {
    if (stories.length === 0) return;

    // stop previous progress and reset
    stopProgress();

    // pause/reset previous video already handled in goNext/goPrev,
    // but also defensively pause here:
    (async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.pauseAsync();
          await videoRef.current.setPositionAsync(0);
        }
      } catch (e) {
        // ignore
      }
    })();

    // hide description
    setShowDesc(false);
    descOpacity.setValue(0);
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }

    // determine media type of new story
    const story = stories[currentIndex];
    const media = story?.media ? story.media.toLowerCase() : "";
    const isVideo = !!media && (media.endsWith(".mp4") || media.endsWith(".mov"));

    // set playing only if new story is video. actual playing will start
    // when the Video's onLoad handler calls startProgress (to use the real duration)
    setPlaying(isVideo ? true : false);

    // For images/text we start progress here (images have fixed 5s)
    if (!isVideo) {
      startProgress(5000);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, stories]);

  // Description toggle with fade
  const toggleDescription = () => {
    // clear any existing timer
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }

    const newState = !showDesc;
    setShowDesc(newState);

    Animated.timing(descOpacity, {
      toValue: newState ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (newState) {
      descTimerRef.current = setTimeout(() => {
        setShowDesc(false);
        Animated.timing(descOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        descTimerRef.current = null;
      }, 5000);
    }
  };

  if (stories.length === 0) return null;

  const story = stories[currentIndex];
  const hasMedia = !!story.media;
  const media = hasMedia ? story.media.toLowerCase() : "";
  const isVideo = media.endsWith(".mp4") || media.endsWith(".mov");
  const isTextOnly = !story.media;

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

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

      {/* 3 Tap Zones */}
      <View style={styles.tapContainer}>
        <Pressable style={styles.leftZone} onPress={goPrevStory} />
        <Pressable style={styles.centerZone} onPress={toggleDescription} />
        <Pressable style={styles.rightZone} onPress={goNextStory} />
      </View>

      {/* Story Content: use key to force remount when currentIndex changes */}
      {isTextOnly ? (
        <View style={[styles.textStory, { backgroundColor: story.bg_color }]}>
          <Text style={styles.textOnlyContent}>{story.text}</Text>
        </View>
      ) : isVideo ? (
        <Video
          // Key forces Video to remount when index changes - avoids stale playback state
          key={`video-${currentIndex}`}
          ref={videoRef}
          source={{ uri: `${BASE_URL}${story.media}` }}
          resizeMode="contain"
          style={{ width, height }}
          shouldPlay={playing}
          isMuted={muted}
          onLoad={async (status: any) => {
            // status.durationMillis should be available when video is loaded
            const durationMs = status?.durationMillis ?? Math.round((status?.duration ?? 5) * 1000);

            // start progress using the actual duration
            if (durationMs && durationMs > 0) {
              startProgress(durationMs);
            } else {
              // fallback
              startProgress(5000);
            }
            // ensure playing state is true so video actually plays
            setPlaying(true);
          }}
          onPlaybackStatusUpdate={(status: any) => {
            // if video finished, advance
            if (status?.didJustFinish) {
              goNextStory();
            }
          }}
        />
      ) : (
        <Image
          key={`image-${currentIndex}`}
          source={{ uri: `${BASE_URL}${story.media}` }}
          style={{ width, height, resizeMode: "contain" }}
        />
      )}

      {/* User bar */}
      <View style={styles.userBar}>
        <Image
          source={{
            uri:
              userInfo?.logo
                ? `${BASE_URL}${userInfo.logo}`
                : "https://i.ibb.co/4pDNDk1/avatar.png",
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{userInfo?.name}</Text>

        {/* Sound Button */}
        {isVideo && (
          <TouchableOpacity
            onPress={() => setMuted(m => !m)}
            style={{ marginLeft: 10 }}
          >
            <Text style={{ color: "#fff", fontSize: 22 }}>
              {muted ? "🔇" : "🔊"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {!isTextOnly && story.text ? (
        <Animated.View style={[styles.descriptionBox, { opacity: descOpacity }]}>
          <Text style={styles.descriptionText}>{story.text}</Text>
        </Animated.View>
      ) : null}

      {/* Close Button */}
      <View style={styles.closeBtn}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 26, color: "#fff" }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  progressContainer: {
    position: "absolute",
    top: 20,
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 8,
    zIndex: 50,
  },

  progressBarBackground: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    height: 3,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 3,
  },

  /* ------------ FIXED TOUCH SYSTEM ------------ */
  tapContainer: {
    position: "absolute",
    width,
    height,
    flexDirection: "row",
    zIndex: 30,
  },
  leftZone: {
    width: width * 0.25,
    height: "100%",
  },
  centerZone: {
    width: width * 0.5,
    height: "100%",
  },
  rightZone: {
    width: width * 0.25,
    height: "100%",
  },

  textStory: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textOnlyContent: {
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
  },

  userBar: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 60,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
  },
  username: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },

  descriptionBox: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 12,
    borderRadius: 10,
  },
  descriptionText: {
    color: "#fff",
    fontSize: 16,
  },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 70,
  },
});