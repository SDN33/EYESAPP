import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, Platform, TouchableOpacity, Linking, Modal, Pressable } from "react-native";
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const isDark = true; // Remplacez ceci par votre logique de détection du thème

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
    <ScrollView style={{ flex: 1, backgroundColor: isDark ? "#181B2C" : "#fff" }} contentContainerStyle={{ padding: 20 }}>
      <Text
        style={{
          color: isDark ? "#fff" : "#18191F",
          fontSize: 28,
          fontWeight: "700",
          marginBottom: 18,
          letterSpacing: 0.5,
          textAlign: "center",
        }}
      >
        Communauté
      </Text>
      <Text
        style={{
          fontWeight: "bold",
          fontSize: 18,
          marginBottom: 14,
          color: isDark ? "#fff" : "#222",
          textAlign: "center",
        }}
      >
        Retrouvez notre actualité, mises à jour et plus encore sur la communauté !
      </Text>
      {posts.map((post) => {
        const imageUrl = getSanityImageUrl(post.image);
        const bodyText = Array.isArray(post.body)
          ? post.body.map((block: any) => block.children?.map((child: any) => child.text).join(" ")).join(" ")
          : typeof post.body === "string"
          ? post.body
          : JSON.stringify(post.body);
        const previewText = bodyText.length > 180 ? bodyText.slice(0, 180) + "..." : bodyText;
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
            <Text style={{ color: "#fff", fontSize: 16, marginBottom: 8 }}>{previewText}</Text>
            {bodyText.length > 180 && (
              Platform.OS === "web" ? (
                <a
                  href="#"
                  style={{ color: "#A259FF", fontWeight: "bold", fontSize: 15, textAlign: "center", display: "block", marginTop: 4, textDecoration: "none" }}
                  onClick={e => {
                    e.preventDefault();
                    setSelectedPost(post);
                    setModalVisible(true);
                  }}
                >
                  Voir plus
                </a>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPost(post);
                    setModalVisible(true);
                  }}
                  style={{ alignSelf: "center" }}
                >
                  <Text style={{ color: "#A259FF", fontWeight: "bold", fontSize: 15 }}>Voir plus</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        );
      })}
      {posts.length === 0 && (
        <Text style={{ color: "#aaa", textAlign: "center" }}>
          Aucun article publié pour le moment.
        </Text>
      )}
      {/* Réseaux sociaux */}
      <View style={{ marginTop: 32, alignItems: "center" }}>
        <Text style={{ color: "#aaa", fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>
          Suivez-nous sur les réseaux sociaux
        </Text>
        <View style={{ flexDirection: "row", gap: 24 }}>
          <TouchableOpacity
            onPress={() => {
              if (typeof window !== "undefined" && window.open) {
                window.open("https://instagram.com/motoangles", "_blank");
              }
            }}
            accessibilityLabel="Instagram"
          >
            <Image
              source={{ uri: isDark
                ? "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg?color=fff"
                : "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" }}
              style={{ width: 36, height: 36, marginRight: 8, tintColor: isDark ? "#fff" : undefined }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (typeof window !== "undefined" && window.open) {
                window.open("https://facebook.com/motoangles", "_blank");
              }
            }}
            accessibilityLabel="Facebook"
          >
            <Image
              source={{ uri: isDark
                ? "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg?color=fff"
                : "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" }}
              style={{ width: 36, height: 36, tintColor: isDark ? "#fff" : undefined }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Mention support */}
      <Text
        style={{
          fontSize: 11,
          color: isDark ? "#888" : "#999",
          textAlign: "center",
          marginTop: 28,
          marginBottom: 8,
          textDecorationLine: "underline",
        }}
        onPress={() => {
          if (Platform.OS === "web") {
            window.location.href = "mailto:support@motoangles.com";
          } else {
            // Sur mobile, mailto fonctionne aussi
            Linking.openURL("mailto:support@motoangles.com");
          }
        }}
      >
        Besoin d'aide ? Contactez le support : support@motoangles.com
      </Text>
      {/* Modal pour afficher le post entier */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: isDark ? "#23242A" : "#fff", borderRadius: 18, padding: 22, maxWidth: 340, width: "90%" }}>
            <Text style={{ fontWeight: "bold", fontSize: 22, color: "#A259FF", marginBottom: 10, textAlign: "center" }}>{selectedPost?.title}</Text>
            {selectedPost?.publishedAt && (
              <Text style={{ color: "#aaa", fontSize: 13, marginBottom: 8, textAlign: "center" }}>
                {new Date(selectedPost.publishedAt).toLocaleDateString()}
              </Text>
            )}
            {selectedPost?.image && (
              Platform.OS === "web" ? (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <img
                    src={getSanityImageUrl(selectedPost.image)}
                    alt={selectedPost.title}
                    style={{ width: 220, height: 120, objectFit: "cover", borderRadius: 12 }}
                  />
                </div>
              ) : (
                <View style={{ alignItems: "center", marginBottom: 10 }}>
                  <Image
                    source={{ uri: getSanityImageUrl(selectedPost.image) }}
                    style={{ width: 220, height: 120, borderRadius: 12, resizeMode: "cover" }}
                  />
                </View>
              )
            )}
            <ScrollView style={{ maxHeight: 260, marginBottom: 16 }}>
              <Text style={{ color: isDark ? "#fff" : "#222", fontSize: 16 }}>
                {selectedPost && (Array.isArray(selectedPost.body)
                  ? selectedPost.body.map((block: any) => block.children?.map((child: any) => child.text).join(" ")).join(" ")
                  : typeof selectedPost.body === "string"
                  ? selectedPost.body
                  : JSON.stringify(selectedPost.body))}
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={{ alignSelf: "center", marginTop: 8, padding: 8 }}
            >
              <Text style={{ color: "#A259FF", fontWeight: "bold", fontSize: 16 }}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
