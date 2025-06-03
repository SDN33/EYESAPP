import React from "react";
import { View, Text, Switch, Button, TouchableOpacity } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { usePremium } from "../../hooks/usePremium";
import { useConsent } from "../../hooks/useConsent";
import { useState } from "react";
import { useUserData } from "../../hooks/useUserData";

export default function SettingsScreen() {
  const { user, login, logout } = useAuth();
  const { isPremium, upgrade } = usePremium();
  const { hasConsent, acceptConsent } = useConsent();
  const [mode, setMode] = useState<"moto" | "voiture">("moto");
  // TODO: lire ce mode depuis profil user/storage si besoin

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {/* Profil et avatar */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40, backgroundColor: "#e0e0e0", 
          alignItems: "center", justifyContent: "center", marginBottom: 10
        }}>
          <Text style={{ fontSize: 34 }}>{user?.name?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>
          {user?.name || "Utilisateur invité"}
        </Text>
        {isPremium && <Text style={{ color: "#7654f6", fontWeight: "bold" }}>Premium ⭐</Text>}
      </View>

      {/* Auth */}
      <View style={{ marginBottom: 20 }}>
        {user ? (
          <Button title="Se déconnecter" onPress={logout} />
        ) : (
          <Button title="Se connecter (Google)" onPress={() => login("Invité")} />
        )}
      </View>

      {/* Mode d'utilisation */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: "bold" }}>Mode d’utilisation :</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => setMode("moto")}
            style={{
              padding: 10, borderRadius: 8, marginRight: 8,
              backgroundColor: mode === "moto" ? "#2196f3" : "#eee"
            }}
          >
            <Text style={{ color: mode === "moto" ? "#fff" : "#222" }}>Moto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("voiture")}
            style={{
              padding: 10, borderRadius: 8,
              backgroundColor: mode === "voiture" ? "#2196f3" : "#eee"
            }}
          >
            <Text style={{ color: mode === "voiture" ? "#fff" : "#222" }}>Voiture</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium */}
      {!isPremium && (
        <View style={{ marginBottom: 20 }}>
          <Button title="Passer Premium" color="#7654f6" onPress={upgrade} />
        </View>
      )}

      {/* Consentement RGPD */}
      <View style={{ marginBottom: 20 }}>
        <Text>Consentement données : {hasConsent ? "Accepté" : "Non donné"}</Text>
        {!hasConsent && <Button title="Donner mon consentement" onPress={acceptConsent} />}
      </View>

      {/* Liens utiles */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity onPress={() => {/* TODO: Open privacy policy */}}>
          <Text style={{ color: "#2176ff" }}>Voir la politique de confidentialité</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* TODO: Open CGU */}}>
          <Text style={{ color: "#2176ff" }}>Voir les CGU</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* TODO: Open feedback mail */}}>
          <Text style={{ color: "#2176ff" }}>Envoyer un feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Version de l'app */}
      <View style={{ alignItems: "center", marginTop: 32 }}>
        <Text style={{ color: "#aaa" }}>Version 1.0.0</Text>
      </View>
    </View>
  );
}
