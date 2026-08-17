import { BASE_URL } from "@/config";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface StoryBubbleProps {
  entry: any;
  group: any;
  isViewed: boolean;
  onPress: () => void;
}

export default function StoryBubble({
  entry,
  group,
  isViewed,
  onPress,
}: StoryBubbleProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --------------------------------------------------
  // ROTATING RING
  // --------------------------------------------------

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotation]);

  // --------------------------------------------------
  // PULSE FOR UNVIEWED STORIES
  // --------------------------------------------------

  useEffect(() => {
    scaleAnim.setValue(1);

    if (!isViewed) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }
  }, [isViewed, scaleAnim]);

  // --------------------------------------------------
  // ROTATION
  // --------------------------------------------------

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // --------------------------------------------------
  // CURRENT GROUP
  // --------------------------------------------------

  // IMPORTANT:
  // Use the group passed to this component.
  // Do NOT search entry.groups here.
  const latestStory = group?.stories?.[0];

  const storyTitle = group?.title || "Story";

  // --------------------------------------------------
  // THUMBNAIL
  // --------------------------------------------------

  const thumbnailUri = latestStory?.thumbnail
    ? `${BASE_URL}${latestStory.thumbnail}`
    : latestStory?.media &&
      !latestStory.media.toLowerCase().endsWith(".mp4") &&
      !latestStory.media.toLowerCase().endsWith(".mov") &&
      !latestStory.media.toLowerCase().endsWith(".m4v")
    ? `${BASE_URL}${latestStory.media}`
    : entry?.user?.logo
    ? `${BASE_URL}${entry.user.logo}`
    : null;

  const RING_SIZE = 72;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        alignItems: "center",
        marginRight: 15,
        paddingTop: 5,
      }}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Rotating Ring */}
        <Animated.View
          style={{
            position: "absolute",
            transform: [
              { rotate: rotateInterpolate },
              { scale: scaleAnim },
            ],
          }}
        >
          <LinearGradient
            colors={[
              "#fbc531",
              "#e84118",
              "#8c7ae6",
              "#0097e6",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_SIZE / 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Animated.View>

        {/* Static Thumbnail */}
        <View
          style={{
            width: RING_SIZE - 6,
            height: RING_SIZE - 6,
            borderRadius: (RING_SIZE - 6) / 2,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={{
                width: RING_SIZE - 12,
                height: RING_SIZE - 12,
                borderRadius: (RING_SIZE - 12) / 2,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: RING_SIZE - 12,
                height: RING_SIZE - 12,
                borderRadius: (RING_SIZE - 12) / 2,
                backgroundColor: "#ccc",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                No Image
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Group Title */}
      <Text
        style={{
          fontSize: 12,
          marginTop: 5,
          textAlign: "center",
          maxWidth: 70,
          color: "#222",
        }}
        numberOfLines={1}
      >
        {storyTitle}
      </Text>
    </TouchableOpacity>
  );
}