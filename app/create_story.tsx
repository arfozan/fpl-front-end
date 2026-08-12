
import { BASE_URL } from "@/config";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Video as VideoCompressor } from "react-native-compressor";
import ViewShot from "react-native-view-shot";
import { useAuth } from "../context/AuthContext";

interface StoryMedia {
  uri: string;
  type: "image" | "video";
  thumbnailUri?: string | null;
  name?: string;
}

export default function CreateStory() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();

  const [mediaItems, setMediaItems] = useState<StoryMedia[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedBg, setSelectedBg] = useState("#ff9a9e");
  const [uploading, setUploading] = useState(false);

  const viewShotRef = useRef<any>(null);

  const backgrounds = [
    "#ff9a9e",
    "#a1c4fd",
    "#fbc531",
    "#8c7ae6",
    "#0097e6",
  ];

  // =========================================================
  // PICK MEDIA
  // =========================================================

  const pickMedia = async () => {
    if (mediaItems.length >= 5) {
      Alert.alert(
        "Maximum Reached",
        "A story group can contain maximum 5 media items."
      );
      return;
    }

    const remaining = 5 - mediaItems.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.2,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;

    const selectedAssets = result.assets.slice(0, remaining);

    const processedItems: StoryMedia[] = [];

    for (const originalAsset of selectedAssets) {
      let asset = { ...originalAsset };

      // =====================================================
      // IMAGE
      // =====================================================

      if (asset.type === "image") {
        try {
          const compressed = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1080 } }],
            {
              compress: 0.6,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          asset.uri = compressed.uri;

          const thumb = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 300 } }],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          processedItems.push({
            uri: asset.uri,
            type: "image",
            thumbnailUri: thumb.uri,
            name: asset.uri.split("/").pop(),
          });
        } catch (err) {
          console.log("Image compression failed:", err);
        }
      }

      // =====================================================
      // VIDEO
      // =====================================================

      if (asset.type === "video") {
        if (asset.duration && asset.duration > 60 * 1000) {
          Alert.alert(
            "Video Too Long",
            "Please choose videos under 60 seconds."
          );
          continue;
        }

        try {
          const compressedUri = await VideoCompressor.compress(asset.uri, {
            compressionMethod: "auto",
            maxSize: 720,
            bitrate: 800000,
            minimumFileSizeForCompress: 0,
          });

          const { uri: thumbnailUri } =
            await VideoThumbnails.getThumbnailAsync(compressedUri, {
              time: 1000,
            });

          processedItems.push({
            uri: compressedUri,
            type: "video",
            thumbnailUri,
            name: compressedUri.split("/").pop(),
          });
        } catch (err) {
          console.log("Video compression failed:", err);
        }
      }
    }

    if (processedItems.length > 0) {
      setMediaItems((prev) =>
        [...prev, ...processedItems].slice(0, 5)
      );
    }
  };

  // =========================================================
  // REMOVE MEDIA
  // =========================================================

  const removeMedia = (index: number) => {
    setMediaItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =========================================================
  // TEXT THUMBNAIL
  // =========================================================

  const generateTextThumbnail = async () => {
    if (!caption) return null;

    if (viewShotRef.current) {
      const uri = await viewShotRef.current.capture();
      return uri;
    }

    return null;
  };

  // =========================================================
  // CREATE STORY GROUP
  // =========================================================

  const createStoryGroup = async () => {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/story-groups/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: groupTitle.trim(),
        }),
      }
    );

    if (!response.ok) {
      let errorData: any = null;

      try {
        errorData = await response.json();
      } catch {}

      console.error(
        "Story group creation failed:",
        errorData
      );

      throw new Error(
        errorData
          ? JSON.stringify(errorData)
          : "Failed to create story group."
      );
    }

    return await response.json();
  };

  // =========================================================
  // UPLOAD ONE STORY
  // =========================================================

  const uploadStory = async (
    groupId: number,
    item: StoryMedia,
    textThumbnail?: string | null
  ) => {
    const formData = new FormData();

    formData.append("group", String(groupId));

    if (caption) {
      formData.append("text", caption);
    }

    formData.append("bg_color", selectedBg);

    formData.append("media", {
      uri: item.uri,
      name:
        item.name ||
        `story_${Date.now()}.${
          item.type === "video" ? "mp4" : "jpg"
        }`,
      type:
        item.type === "video"
          ? "video/mp4"
          : "image/jpeg",
    } as any);

    if (item.thumbnailUri) {
      formData.append("thumbnail", {
        uri: item.thumbnailUri,
        name: `thumbnail_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);
    } else if (textThumbnail) {
      formData.append("thumbnail", {
        uri: textThumbnail,
        name: "thumbnail.jpg",
        type: "image/jpeg",
      } as any);
    }

    const response = await fetchWithAuth(
      `${BASE_URL}/api/stories/`,
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (!response.ok) {
      let errorData: any = null;

      try {
        errorData = await response.json();
      } catch {}

      console.error(
        "Story upload failed:",
        errorData
      );

      throw new Error(
        errorData
          ? JSON.stringify(errorData)
          : "Failed to upload story."
      );
    }

    return await response.json();
  };

  // =========================================================
  // SUBMIT GROUP
  // =========================================================

  const submitStoryGroup = async () => {
    const title = groupTitle.trim();

    if (!title) {
      Alert.alert(
        "Title Required",
        "Please enter a title for your story group."
      );
      return;
    }

    if (title.length > 50) {
      Alert.alert(
        "Title Too Long",
        "Story group title cannot exceed 50 characters."
      );
      return;
    }

    if (mediaItems.length === 0 && !caption) {
      Alert.alert(
        "Error",
        "Please add a caption or pick at least one media item."
      );
      return;
    }

    if (mediaItems.length > 5) {
      Alert.alert(
        "Error",
        "Maximum 5 media items are allowed in one group."
      );
      return;
    }

    setUploading(true);

    try {
      // -----------------------------------------------------
      // CREATE GROUP
      // -----------------------------------------------------

      const group = await createStoryGroup();

      // -----------------------------------------------------
      // TEXT ONLY STORY
      // -----------------------------------------------------

      if (mediaItems.length === 0 && caption) {
        const textThumbnail =
          await generateTextThumbnail();

        const formData = new FormData();

        formData.append(
          "group",
          String(group.id)
        );

        formData.append("text", caption);
        formData.append("bg_color", selectedBg);

        if (textThumbnail) {
          formData.append("thumbnail", {
            uri: textThumbnail,
            name: "thumbnail.jpg",
            type: "image/jpeg",
          } as any);
        }

        const response = await fetchWithAuth(
          `${BASE_URL}/api/stories/`,
          {
            method: "POST",
            body: formData,
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        if (!response.ok) {
          let errorData: any = null;

          try {
            errorData = await response.json();
          } catch {}

          throw new Error(
            errorData
              ? JSON.stringify(errorData)
              : "Failed to upload story."
          );
        }
      }

      // -----------------------------------------------------
      // MEDIA GROUP
      // -----------------------------------------------------

      else {
        for (let i = 0; i < mediaItems.length; i++) {
          await uploadStory(
            group.id,
            mediaItems[i]
          );
        }
      }

      await fetchWithAuth(
      `${BASE_URL}/api/story-groups/${group.id}/notify/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

      Alert.alert(
        "Story Posted!",
        "Your story group has been posted successfully."
      );

      router.back();

    } catch (error) {
      console.error(
        "Story group upload error:",
        error
      );

      Alert.alert(
        "Error",
        "Something went wrong while posting the story."
      );

    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
    >
      <Text style={styles.header}>
        Create Story
      </Text>

      {/* =====================================================
          GROUP TITLE
      ===================================================== */}

      <Text style={styles.sectionTitle}>
        Story Title
      </Text>

      <TextInput
        style={styles.titleInput}
        placeholder="e.g. Match Day, Training, Weekend..."
        placeholderTextColor="#999"
        value={groupTitle}
        onChangeText={setGroupTitle}
        maxLength={50}
      />

      <Text style={styles.characterCount}>
        {groupTitle.length}/50
      </Text>

      {/* =====================================================
          HIDDEN TEXT THUMBNAIL
      ===================================================== */}

      {mediaItems.length === 0 && (
        <ViewShot
          ref={viewShotRef}
          options={{
            format: "jpg",
            quality: 0.7,
          }}
          style={{
            width: 300,
            height: 400,
            backgroundColor: selectedBg,
            justifyContent: "center",
            alignItems: "center",
            opacity: 0,
            position: "absolute",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 30,
              textAlign: "center",
            }}
          >
            {caption}
          </Text>
        </ViewShot>
      )}

      {/* =====================================================
          MEDIA PREVIEWS
      ===================================================== */}

      {mediaItems.length > 0 ? (
        <View>
          <View style={styles.mediaHeader}>
            <Text style={styles.mediaCount}>
              {mediaItems.length}/5 media selected
            </Text>

            {mediaItems.length < 5 && (
              <TouchableOpacity
                onPress={pickMedia}
                style={styles.addMoreButton}
              >
                <Text style={styles.addMoreText}>
                  + Add More
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mediaGrid}>
            {mediaItems.map((item, index) => (
              <View
                key={`${item.uri}-${index}`}
                style={styles.mediaItem}
              >
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.mediaPreview}
                  />
                ) : item.thumbnailUri ? (
                  <Image
                    source={{
                      uri: item.thumbnailUri,
                    }}
                    style={styles.mediaPreview}
                  />
                ) : (
                  <View
                    style={[
                      styles.mediaPreview,
                      {
                        backgroundColor: "#333",
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text style={{ color: "#fff" }}>
                      🎥
                    </Text>
                  </View>
                )}

                {item.type === "video" && (
                  <View style={styles.videoBadge}>
                    <Text style={styles.videoBadgeText}>
                      ▶
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() =>
                    removeMedia(index)
                  }
                >
                  <Text style={styles.removeText}>
                    ×
                  </Text>
                </TouchableOpacity>

                <View style={styles.indexBadge}>
                  <Text style={styles.indexBadgeText}>
                    {index + 1}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.mediaPicker}
          onPress={pickMedia}
        >
          {caption ? (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: selectedBg,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {caption}
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#fff" }}>
              Pick Image / Video or Add Text
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* =====================================================
          CAPTION
      ===================================================== */}

      <TextInput
        style={styles.input}
        placeholder="Caption (optional)"
        placeholderTextColor="#aaa"
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {/* =====================================================
          BACKGROUND COLORS
      ===================================================== */}

      {mediaItems.length === 0 && (
        <View style={styles.backgroundSection}>
          <Text style={styles.backgroundTitle}>
            Background
          </Text>

          <View
            style={{
              flexDirection: "row",
            }}
          >
            {backgrounds.map((bg) => (
              <TouchableOpacity
                key={bg}
                onPress={() =>
                  setSelectedBg(bg)
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: bg,
                  marginRight: 10,
                  borderWidth:
                    selectedBg === bg ? 3 : 0,
                  borderColor: "#000",
                }}
              />
            ))}
          </View>
        </View>
      )}

      {/* =====================================================
          POST BUTTON
      ===================================================== */}

      <TouchableOpacity
        style={[
          styles.uploadButton,
          uploading && {
            opacity: 0.6,
          },
        ]}
        onPress={submitStoryGroup}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadText}>
            {mediaItems.length > 1
              ? "Post Story Group"
              : "Post Story"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  titleInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },

  characterCount: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
    marginBottom: 15,
  },

  mediaPicker: {
    height: 230,
    backgroundColor: "#888",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  mediaCount: {
    fontSize: 16,
    fontWeight: "600",
  },

  addMoreButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },

  addMoreText: {
    color: "#fff",
    fontWeight: "600",
  },

  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  mediaItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#ddd",
  },

  mediaPreview: {
    width: "100%",
    height: "100%",
  },

  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  removeText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "bold",
  },

  indexBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  indexBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  videoBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  videoBadgeText: {
    color: "#fff",
    fontSize: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
    textAlignVertical: "top",
  },

  backgroundSection: {
    marginBottom: 20,
  },

  backgroundTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },

  uploadButton: {
    backgroundColor: "#c71d1d",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});