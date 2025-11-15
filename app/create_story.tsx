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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Video as VideoCompressor } from "react-native-compressor";
import ViewShot from "react-native-view-shot";
import { useAuth } from "../context/AuthContext";

export default function CreateStory() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();

  const [media, setMedia] = useState<any>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedBg, setSelectedBg] = useState("#ff9a9e");
  const [uploading, setUploading] = useState(false);

  const viewShotRef = useRef<any>(null);

  const backgrounds = ["#ff9a9e", "#a1c4fd", "#fbc531", "#8c7ae6", "#0097e6"];

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.2,
      allowsEditing: false,
    });

    if (result.canceled) return;
    let asset = result.assets[0];

    // ✅ IMAGE COMPRESSION + THUMBNAIL
    if (asset.type === "image") {
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        );
        asset.uri = compressed.uri;

        const thumb = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setThumbnailUri(thumb.uri);
      } catch (err) {
        console.log("Image compression failed", err);
      }
    }

    // ✅ VIDEO COMPRESSION + THUMBNAIL
    if (asset.type === "video") {
      if (asset.duration && asset.duration > 60 * 1000) {
        Alert.alert("Video Too Long", "Please choose a video under 60 seconds.");
        return;
      }
      try {
        const compressedUri = await VideoCompressor.compress(asset.uri, {
          compressionMethod: "auto",
          maxSize: 720,
          bitrate: 800000,
          minimumFileSizeForCompress: 0,
        });
        asset.uri = compressedUri;

        // generate thumbnail
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
        setThumbnailUri(uri);
      } catch (err) {
        console.log("Video compression failed", err);
      }
    }

    setMedia(asset);
  };

  const generateTextThumbnail = async () => {
    if (!caption) return null;
    if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        setThumbnailUri(uri); // optional (for preview)
        return uri;           // ✅ return actual URI
    }
    return null;
    };

  const uploadStoryInBackground = async (textThumb?: string | null) => {
    setUploading(true);
    try {
        const formData = new FormData();
        formData.append("text", caption);
        formData.append("bg_color", selectedBg);

        if (media) {
        formData.append("media", {
            uri: media.uri,
            name: media.uri.split("/").pop(),
            type: media.type === "video" ? "video/mp4" : "image/jpeg",
        });
        }

        const finalThumb = textThumb ?? thumbnailUri;

        if (finalThumb) {
        formData.append("thumbnail", {
            uri: finalThumb,
            name: "thumbnail.jpg",
            type: "image/jpeg",
        });
        }

        await fetchWithAuth(`${BASE_URL}/api/stories/`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
        });
    } finally {
        setUploading(false);
    }
    };

  const submitStory = async () => {
    if (!media && !caption) {
        Alert.alert("Error", "Please add a caption or pick media.");
        return;
    }

    let textThumb = null;

    if (!media && caption) {
        textThumb = await generateTextThumbnail();  // ✅ actual value
    }

    uploadStoryInBackground(textThumb);  // ✅ pass thumbnail directly
    Alert.alert("Story Posted!", "Your story is uploading in background and will appear shortly.");
    router.back();
    };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Story</Text>

      {/* Hidden View for text thumbnail */}
      {!media && (
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.7 }}
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
          <Text style={{ color: "#fff", fontSize: 30, textAlign: "center" }}>
            {caption}
          </Text>
        </ViewShot>
      )}

      {/* Media Picker */}
      <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
        {media ? (
          media.type === "image" ? (
            <Image source={{ uri: media.uri }} style={styles.preview} />
          ) : (
            <Text style={{ color: "#fff" }}>🎥 Video Selected</Text>
          )
        ) : caption ? (
          <View
            style={{
              ...styles.preview,
              backgroundColor: selectedBg,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
              {caption}
            </Text>
          </View>
        ) : (
          <Text style={{ color: "#fff" }}>Pick Image / Video or Add Text</Text>
        )}
      </TouchableOpacity>

      {/* Caption input */}
      <TextInput
        style={styles.input}
        placeholder="Caption (optional)"
        placeholderTextColor="#aaa"
        value={caption}
        onChangeText={setCaption}
      />

      {/* Background selector */}
      {!media && (
        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          {backgrounds.map((bg) => (
            <TouchableOpacity
              key={bg}
              onPress={() => setSelectedBg(bg)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: bg,
                marginRight: 10,
                borderWidth: selectedBg === bg ? 2 : 0,
                borderColor: "#fff",
              }}
            />
          ))}
        </View>
      )}

      {/* Upload button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={submitStory}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadText}>Post Story</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  mediaPicker: {
    height: 230,
    backgroundColor: "#888",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  preview: { width: "100%", height: "100%", borderRadius: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#c71d1d",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  uploadText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});