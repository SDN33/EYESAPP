import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, Platform, TouchableOpacity, Linking, Modal, Pressable } from "react-native";
import sanityClient from "../../services/sanityClient";
import Constants from "expo-constants";
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

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
  const colorScheme = useColorScheme() ?? 'light';
  const bgColor = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;

  // Pagination côté communauté (scalabilité)
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        let data;
        if (Platform.OS === 'web') {
          const query = encodeURIComponent(`*[_type == "post"] | order(publishedAt desc)[${(page-1)*PAGE_SIZE}...${page*PAGE_SIZE}]{_id, title, slug, publishedAt, image, body}`);
          const projectId = 'o23wpsz2';
          const dataset = 'production';
          const url = `https://corsproxy.io/?https://${projectId}.api.sanity.io/v2025-06-04/data/query/${dataset}?query=${query}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Erreur Sanity (CORS)');
          const json = await res.json();
          data = json.result;
        } else {
          data = await sanityClient.fetch(`*[_type == "post"] | order(publishedAt desc)[${(page-1)*PAGE_SIZE}...${page*PAGE_SIZE}]{_id, title, slug, publishedAt, image, body}`);
        }
        if (isMounted) {
          setPosts(prev => page === 1 ? data : [...prev, ...data]);
          setHasMore(data.length === PAGE_SIZE);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Erreur de chargement");
          setLoading(false);
        }
      }
    };
    fetchPosts();
    return () => { isMounted = false; };
  }, [page]);

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bgColor }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bgColor }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors[colorScheme].background, paddingTop: 48 }}
      contentContainerStyle={{ flexGrow: 1 }}
      onMomentumScrollEnd={e => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        if (hasMore && layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
          setPage(p => hasMore ? p + 1 : p);
        }
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ backgroundColor: Colors[colorScheme].background, paddingTop: 10 }}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Image source={require('../../assets/images/EYES_Horizontal.pdf-removebg-preview.png')} style={{ width: 170, height: 85, borderRadius: 16, marginBottom: 2, marginTop: -10, shadowColor: '#A259FF', shadowOpacity: 0.13, shadowRadius: 10, backgroundColor: '#23242A' }} resizeMode="contain" />
          </View>
          <Text
            style={{
              color: textColor,
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 10,
              letterSpacing: 0.2,
              textAlign: "center",
            }}
          >
            Communauté
          </Text>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 15,
              marginBottom: 18,
              color: textColor,
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
                  marginBottom: 18,
                  backgroundColor: colorScheme === 'dark' ? "#232650" : "#f3f4f6",
                  borderRadius: 8,
                  padding: 15,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 17, color: colorScheme === 'dark' ? "#7c3aed" : "#6366f1", marginBottom: 4 }}>{post.title}</Text>
                {post.publishedAt && (
                  <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 4 }}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </Text>
                )}
                {/* Affichage image si présente */}
                {imageUrl && (
                  Platform.OS === "web" ? (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                      <img
                        src={imageUrl}
                        alt={post.title}
                        style={{ width: 180, height: 90, objectFit: "cover", borderRadius: 8 }}
                      />
                    </div>
                  ) : (
                    <View style={{ alignItems: "center", marginBottom: 8 }}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={{ width: 180, height: 90, borderRadius: 8, resizeMode: "cover" }}
                      />
                    </View>
                  )
                )}
                <Text style={{ color: textColor, fontSize: 15, marginBottom: 6 }}>{previewText}</Text>
                {bodyText.length > 180 && (
                  Platform.OS === "web" ? (
                    <a
                      href="#"
                      style={{ color: colorScheme === 'dark' ? "#a78bfa" : "#7c3aed", fontWeight: "bold", fontSize: 14, textAlign: "center", display: "block", marginTop: 2, textDecoration: "none" }}
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
                      <Text style={{ color: colorScheme === 'dark' ? "#a78bfa" : "#7c3aed", fontWeight: "bold", fontSize: 14 }}>Voir plus</Text>
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
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <Text style={{ color: "#aaa", fontWeight: "600", fontSize: 13, marginBottom: 8 }}>
              Suivez-nous sur les réseaux sociaux
            </Text>
            <View style={{ flexDirection: "row", gap: 18, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://instagram.com/motoangles")}
                accessibilityLabel="Instagram"
              >
                <Ionicons name="logo-instagram" size={30} color={colorScheme === 'dark' ? '#fff' : '#7c3aed'} style={{ marginRight: 2 }} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://facebook.com/motoangles")}
                accessibilityLabel="Facebook"
              >
                <Ionicons name="logo-facebook" size={30} color={colorScheme === 'dark' ? '#fff' : '#7c3aed'} style={{ marginRight: 2 }} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://twitter.com/motoangles")}
                accessibilityLabel="X"
              >
                <Ionicons name="logo-twitter" size={30} color={colorScheme === 'dark' ? '#fff' : '#7c3aed'} style={{ marginRight: 2 }} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://youtube.com/@motoangles")}
                accessibilityLabel="YouTube"
              >
                <Ionicons name="logo-youtube" size={30} color={colorScheme === 'dark' ? '#fff' : '#7c3aed'} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Mention support */}
          <Text
            style={{
              fontSize: 11,
              color: colorScheme === 'dark' ? "#888" : "#999",
              textAlign: "center",
              marginTop: 18,
              marginBottom: 6,
              textDecorationLine: "underline",
            }}
            onPress={() => {
              if (Platform.OS === "web") {
                window.location.href = "mailto:support@motoangles.com";
              } else {
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
              <View style={{ backgroundColor: colorScheme === 'dark' ? "#232650" : "#fff", borderRadius: 12, padding: 18, maxWidth: 340, width: "90%" }}>
                <Text style={{ fontWeight: "bold", fontSize: 19, color: colorScheme === 'dark' ? "#7c3aed" : "#6366f1", marginBottom: 8, textAlign: "center" }}>{selectedPost?.title}</Text>
                {selectedPost?.publishedAt && (
                  <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 6, textAlign: "center" }}>
                    {new Date(selectedPost.publishedAt).toLocaleDateString()}
                  </Text>
                )}
                {selectedPost?.image && (
                  Platform.OS === "web" ? (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                      <img
                        src={getSanityImageUrl(selectedPost.image)}
                        alt={selectedPost.title}
                        style={{ width: 180, height: 90, objectFit: "cover", borderRadius: 8 }}
                      />
                    </div>
                  ) : (
                    <View style={{ alignItems: "center", marginBottom: 8 }}>
                      <Image
                        source={{ uri: getSanityImageUrl(selectedPost.image) }}
                        style={{ width: 180, height: 90, borderRadius: 8, resizeMode: "cover" }}
                      />
                    </View>
                  )
                )}
                <ScrollView style={{ maxHeight: 220, marginBottom: 10 }}>
                  <Text style={{ color: textColor, fontSize: 15 }}>
                    {selectedPost && (Array.isArray(selectedPost.body)
                      ? selectedPost.body.map((block: any) => block.children?.map((child: any) => child.text).join(" ")).join(" ")
                      : typeof selectedPost.body === "string"
                      ? selectedPost.body
                      : JSON.stringify(selectedPost.body))}
                  </Text>
                </ScrollView>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={{ alignSelf: "center", marginTop: 6, padding: 6 }}
                >
                  <Text style={{ color: colorScheme === 'dark' ? "#a78bfa" : "#7c3aed", fontWeight: "bold", fontSize: 14 }}>Fermer</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </ScrollView>
  );
}
