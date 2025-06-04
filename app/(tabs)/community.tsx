import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, Platform } from "react-native";
import sanityClient from "../../services/sanityClient";
import Constants from "expo-constants";

type Post = {
  _id: string;
  title: string;
  slug?: { current: string };
  publishedAt?: string;
  image?: { asset: { _ref: string; url?: string } };
  body: any;
};

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sanityClient
      .fetch(`*[_type == "post"]{_id, title, slug, publishedAt, image, body}`)
      .then((data: Post[]) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Erreur de chargement");
        setLoading(false);
      });
  }, []);

  // Utilitaire pour obtenir l'URL de l'image Sanity (robuste)
  function getSanityImageUrl(image: any) {
    if (!image?.asset) return undefined;
    if (image.asset.url) return image.asset.url;
    const ref = image.asset._ref;
    if (!ref) return undefined;
    const parts = ref.split("-");
    if (parts.length < 4) return undefined;
    const [, assetId, dimensions, format] = parts;
    // Utilise les mêmes valeurs que dans sanityClient.js
    const projectId = "o23wpsz2";
    const dataset = "production";
    const url = `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${format}`;
    if (typeof window !== "undefined") {
      console.log("Sanity image debug:", { ref, projectId, dataset, url });
    }
    return url;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#111216" }} contentContainerStyle={{ padding: 20 }}>
      {posts.map((post) => {
        const imageUrl = getSanityImageUrl(post.image);
        return (
          <View
            key={post._id}
            style={{
              marginBottom: 32,
              backgroundColor: "#23242A",
              borderRadius: 16,
              padding: 18,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 20, color: "#A259FF", marginBottom: 8 }}>{post.title}</Text>
            {post.publishedAt && (
              <Text style={{ color: "#aaa", fontSize: 13, marginBottom: 6 }}>
                {new Date(post.publishedAt).toLocaleDateString()}
              </Text>
            )}
            {/* Affichage image si présente */}
            {imageUrl && (
              Platform.OS === "web" ? (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <img
                    src={imageUrl}
                    alt={post.title}
                    style={{ width: 220, height: 120, objectFit: "cover", borderRadius: 12 }}
                  />
                </div>
              ) : (
                <View style={{ alignItems: "center", marginBottom: 10 }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: 220, height: 120, borderRadius: 12, resizeMode: "cover" }}
                  />
                </View>
              )
            )}
            {/* Affichage du body (simple) */}
            <Text style={{ color: "#fff", fontSize: 16 }}>
              {Array.isArray(post.body)
                ? post.body.map((block: any, i: number) => block.children?.map((child: any) => child.text).join(" ")).join("\n")
                : typeof post.body === "string"
                ? post.body
                : JSON.stringify(post.body)}
            </Text>
          </View>
        );
      })}
      {posts.length === 0 && (
        <Text style={{ color: "#aaa", textAlign: "center" }}>
          Aucun article publié pour le moment.
        </Text>
      )}
    </ScrollView>
  );
}
