// screens/CreateNewsScreen.tsx
import { BASE_URL } from "@/config";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function CreateNewsScreen() {
  const { fetchWithAuth } = useAuth();

  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const postNews = async () => {
    if (!headline || !content) {
      Alert.alert("Error", "Please provide both headline and content");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("headline", headline);
      formData.append("content", content);

      if (image) {
        formData.append("title_image", {
          uri: image,
          name: "upload.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetchWithAuth(`${BASE_URL}/api/news/`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        Alert.alert("Success", "News posted successfully!");
        setHeadline("");
        setContent("");
        setImage(null);
      } else {
        const data = await res.json();
        Alert.alert("Error", JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong while posting news");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Create News</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Headline</Text>
        <TextInput
          style={styles.input}
          value={headline}
          onChangeText={setHeadline}
          placeholder="Enter an headline..."
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, { height: 160 }]}
          value={content}
          onChangeText={setContent}
          placeholder="Write your story here..."
          multiline
          placeholderTextColor="#888"
        />

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Pick an Image</Text>
        </TouchableOpacity>

        {image && (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        )}

        <TouchableOpacity
          style={[styles.postButton, loading && { opacity: 0.7 }]}
          onPress={postNews}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post News</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1d296b",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    color: "#444",
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    fontSize: 14,
    color: "#222",
  },
  imageButton: {
    marginTop: 16,
    backgroundColor: "#1d296b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  postButton: {
    marginTop: 20,
    backgroundColor: "#007aff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});