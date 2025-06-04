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
  // TODO: lire ce mode depuis profil user/storage si besoin

  const colorScheme = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: isDark ? '#111216' : '#fff' }}>
      {/* Profil et avatar */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? "#23242A" : "#e0e0e0",
          alignItems: "center", justifyContent: "center", marginBottom: 10
        }}>
          <Text style={{ fontSize: 34, color: isDark ? "#fff" : "#222" }}>{user?.name?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={{ fontWeight: "bold", fontSize: 18, color: isDark ? "#fff" : "#222" }}>
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

      {/* Premium */}
      {!isPremium && (
        <View style={{ marginBottom: 20 }}>
          <Button title="Passer Premium" color="#7654f6" onPress={upgrade} />
        </View>
      )}

      {/* Consentement RGPD */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: isDark ? "#fff" : "#222" }}>Consentement données : {hasConsent ? "Accepté" : "Non donné"}</Text>
        {!hasConsent && <Button title="Donner mon consentement" onPress={acceptConsent} />}
      </View>

      {/* Liens utiles */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity onPress={() => {/* TODO: Open privacy policy */}}>
          <Text style={{ color: isDark ? "#60A5FA" : "#2176ff" }}>Voir la politique de confidentialité</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* TODO: Open CGU */}}>
          <Text style={{ color: isDark ? "#60A5FA" : "#2176ff" }}>Voir les CGU</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* TODO: Open feedback mail */}}>
          <Text style={{ color: isDark ? "#60A5FA" : "#2176ff" }}>Envoyer un feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Version de l'app */}
      <View style={{ alignItems: "center", marginTop: 32 }}>
        <Text style={{ color: isDark ? "#aaa" : "#888" }}>Version 1.0.0</Text>
      </View>
    </View>
  );
}
