// app/(tabs)/settings.tsx
import React from "react";
import { View, Text, TouchableOpacity, Switch, Animated } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { usePremium } from "../../hooks/usePremium";
import { useConsent } from "../../hooks/useConsent";
import { Ionicons } from "@expo/vector-icons";

// Animation shimmer simple (avatar)
function ShimmerAvatar() {
  return (
    <View style={{
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: "#232650", alignItems: "center", justifyContent: "center",
      overflow: "hidden"
    }}>
      <Animated.View
        style={{
          position: "absolute", width: 90, height: 90, borderRadius: 45,
          backgroundColor: "#232650", opacity: 0.5
        }}
      />
      <Ionicons name="person-outline" size={40} color="#6366f1" />
    </View>
  );
}

export default function SettingsScreen() {
  const { user, login, logout } = useAuth();
  const { isPremium, upgrade } = usePremium();
  const { hasConsent, acceptConsent } = useConsent();

  // Tu pourrais aussi ajouter une gestion du "mode" (moto/voiture) ici, selon ton cahier des charges

  return (
    <View style={{ flex: 1, backgroundColor: "#181B2C", padding: 24 }}>
      {/* Avatar / Profil */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        {user ? (
          <View style={{
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: "#232650", alignItems: "center", justifyContent: "center",
            borderWidth: isPremium ? 3 : 0,
            borderColor: isPremium ? "#a78bfa" : "transparent"
          }}>
            <Text style={{ fontSize: 38, color: "#7dd3fc", fontWeight: "bold" }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </Text>
            {isPremium && (
              <View style={{
                position: "absolute", right: -5, bottom: -5, backgroundColor: "#312e81",
                borderRadius: 18, padding: 4, borderWidth: 2, borderColor: "#181B2C"
              }}>
                <Ionicons name="star" size={16} color="#eab308" />
              </View>
            )}
          </View>
        ) : (
          <ShimmerAvatar />
        )}
        <Text style={{ fontWeight: "600", fontSize: 20, color: "#fff", marginTop: 10 }}>
          {user?.name || "Utilisateur invité"}
        </Text>
      </View>

      {/* Séparateur */}
      <View style={{ height: 1, backgroundColor: "#232650", marginVertical: 12 }} />

      {/* Authentification */}
      <View style={{ marginBottom: 18 }}>
        {user ? (
          <TouchableOpacity
            onPress={logout}
            style={{
              backgroundColor: "#232650", borderRadius: 8, padding: 14, alignItems: "center"
            }}>
            <Text style={{ color: "#f472b6", fontWeight: "bold", fontSize: 16 }}>
              <Ionicons name="log-out-outline" size={18} /> Se déconnecter
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => login("google")}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: "#222", borderRadius: 8, padding: 13, marginBottom: 10
              }}>
              <Ionicons name="logo-google" size={20} color="#60a5fa" />
              <Text style={{ color: "#60a5fa", marginLeft: 8, fontWeight: "bold", fontSize: 16 }}>
                Connexion Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => login("apple")}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: "#222", borderRadius: 8, padding: 13
              }}>
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 8, fontWeight: "bold", fontSize: 16 }}>
                Connexion Apple
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Premium */}
      {!isPremium && (
        <TouchableOpacity
          onPress={upgrade}
          style={{
            backgroundColor: "#7c3aed", borderRadius: 8, padding: 14,
            alignItems: "center", marginBottom: 18
          }}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            <Ionicons name="diamond-outline" size={17} color="#fff" /> Passer Premium
          </Text>
        </TouchableOpacity>
      )}

      {/* Consentement RGPD */}
      <View style={{
        backgroundColor: "#232650", borderRadius: 8, padding: 16, marginBottom: 20,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between"
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons
            name={!!hasConsent ? "checkmark-circle" : "alert-circle-outline"}
            size={20}
            color={!!hasConsent ? "#60a5fa" : "#f59e42"}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: "#fff" }}>Partage de données anonymes</Text>
        </View>
        <Switch
          value={!!hasConsent}
          onValueChange={acceptConsent}
          trackColor={{ true: "#60a5fa", false: "#555" }}
          thumbColor={!!hasConsent ? "#60a5fa" : "#888"}
        />
      </View>

      {/* Liens utiles */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity onPress={() => {/* TODO: Open privacy policy */ }} style={{ marginBottom: 6 }}>
          <Text style={{ color: "#60a5fa" }}>
            <Ionicons name="lock-closed-outline" size={15} /> Politique de confidentialité
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* TODO: Open CGU */ }} style={{ marginBottom: 6 }}>
          <Text style={{ color: "#60a5fa" }}>
            <Ionicons name="document-text-outline" size={15} /> CGU
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* TODO: Open feedback mail */ }}>
          <Text style={{ color: "#60a5fa" }}>
            <Ionicons name="mail-outline" size={15} /> Donner un feedback
          </Text>
        </TouchableOpacity>
      </View>

      {/* App version */}
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: "#6366f1", fontSize: 13 }}>Version 1.0.0</Text>
      </View>
    </View>
  );
}
