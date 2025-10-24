import { BASE_URL } from "@/config";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, useWindowDimensions, View } from "react-native";
import RenderHtml, { CustomRendererProps, defaultHTMLElementModels } from "react-native-render-html";
import { WebView } from "react-native-webview";

interface NewsItem {
  id: number;
  headline: string;
  title_image: string;
  content: string;
  date_posted: string;
  author: string;
  images: string[];
}

export default function NewsDetail() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No news ID provided");
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/api/news/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("News not found");
        return res.json();
      })
      .then((data) => {
        setNews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // --- Utility: Decode escaped HTML entities like &lt;iframe&gt; ---
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  };

  // --- Extract YouTube video ID from various URL formats ---
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // --- Custom renderer for <iframe> ---
  const renderers = {
    iframe: (props: CustomRendererProps<any>) => {
      const src = props.tnode.attributes.src;
      if (!src) return null;

      const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");
      const videoId = isYouTube ? getYouTubeVideoId(src) : null;
      const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : src;

      return (
        <View
          style={{
            width: width - 32,
            height: 220,
            marginVertical: 10,
            backgroundColor: "#000",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1 }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            androidLayerType="hardware"
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      );
    },
  };

  const customHTMLElementModels = {
    iframe: defaultHTMLElementModels.iframe.extend({
      contentModel: "block",
    }),
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#282d6d" />
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
        <Text style={{ color: "red" }}>{error || "News not found"}</Text>
      </View>
    );
  }

  const fixedHtml = decodeHtmlEntities(news.content)
  // Replace <oembed> with iframes (same as before)
  .replace(
    /<oembed[^>]+url="([^"]+)"[^>]*>(?:<\/oembed>)?/g,
    (match: string, url: string) => {
      const videoId = getYouTubeVideoId(url);
      return videoId
        ? `<iframe src="https://www.youtube.com/embed/${videoId}" width="100%" height="220" frameborder="0" allowfullscreen></iframe>`
        : "";
    }
  )
  // Fix local image URLs
  .replace(
    /<img([^>]*)src="(\/media\/[^"]+)"([^>]*)>/g,
    (match: string, before: string, src: string, after: string) => {
      const fullUrl = `${BASE_URL}${src}`; // prepend your base URL
      return `<img${before}src="${fullUrl}"${after} style="max-width:100%;height:auto;" />`;
    }
  )
  // Existing remote image handling (optional if you have special ck-upload-id images)
  .replace(
    /<img[^>]*data-ck-upload-id="([^"]+)"[^>]*>/g,
    (match: string, id: string) => {
      return `<img src="${BASE_URL}/media/uploads/${id}" style="max-width:100%;height:auto;" />`;
    }
  )
  .replace(
    /<iframe/g,
    '<iframe allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"'
  );


  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        {news.title_image && (
          <Image
            source={{ uri: news.title_image }}
            style={{
              width: "100%",
              height: 200,
              resizeMode: "cover",
              borderRadius: 8,
              marginBottom: 16,
              backgroundColor: "#ccc",
            }}
          />
        )}

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 8,
              color: "#282d6d",
            }}
          >
            {news.headline}
          </Text>
          <Text style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
            {news.author} • {new Date(news.date_posted).toLocaleDateString()}
          </Text>

          <RenderHtml
            contentWidth={width - 32}
            source={{ html: fixedHtml }}
            renderers={renderers}
            customHTMLElementModels={customHTMLElementModels}
            enableExperimentalMarginCollapsing
            tagsStyles={{
              p: { fontSize: 16, lineHeight: 24, color: "#333", marginBottom: 16 },
              strong: { fontWeight: "700", color: "#000" },
              em: { fontStyle: "italic", color: "#333" },
              h2: { fontSize: 20, fontWeight: "bold", marginVertical: 12, color: "#282d6d" },
              img: { borderRadius: 8, marginVertical: 16 },
              iframe: { borderRadius: 8, marginVertical: 16 },
              a: { color: "#282d6d", textDecorationLine: "underline" },
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
