import React, { useState, useEffect } from "react";
import { View, Animated, TouchableOpacity, Platform } from "react-native";
import { useConsent } from "../../hooks/useConsent";
import ConsentModal from "../../components/common/ConsentModal";
import ExploreMotoScreen from "../../components/common/ExploreMotoScreen";
import ExploreVoitureScreen from "../../components/common/ExploreVoitureScreen";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "../../components/ui/IconSymbol";
import { useThemeMode } from '../../hooks/ThemeContext';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const [mode, setMode] = useState<"motard" | "voiture">("motard");
  const [fadeAnim] = useState(new Animated.Value(1));
  const { colorScheme } = useThemeMode();

  // Animation de transition futuriste/minimaliste
  const switchMode = (newMode: "motard" | "voiture") => {
    if (newMode === mode) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: Platform.OS !== 'web' })
    ]).start(() => setMode(newMode));
    setTimeout(() => setMode(newMode), 220); // Pour le switch réel après fade out
    // Stocker le mode pour le tracking global
    const trackingMode = newMode === 'voiture' ? 'auto' : 'moto';
    AsyncStorage.setItem('tracking_mode', trackingMode).catch(() => {});
  };

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme]?.background ?? "#fff", marginTop: 30 }}>
      {/* Switcher d'interface moto/auto en haut à droite */}
      <View style={{ position: "absolute", top: 14, right: 24, zIndex: 10, flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={() => switchMode("motard")}
          style={{ opacity: mode === "motard" ? 1 : 0.5, backgroundColor: mode === "motard" ? "#A259FF22" : "transparent", borderRadius: 999, padding: 8 }}
        >
          <IconSymbol name="motorcycle" size={28} color={mode === "motard" ? "#A259FF" : "#aaa"} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => switchMode("voiture")}
          style={{ opacity: mode === "voiture" ? 1 : 0.5, backgroundColor: mode === "voiture" ? "#60A5FA22" : "transparent", borderRadius: 999, padding: 8 }}
        >
          <Ionicons name="car-sport" size={28} color={mode === "voiture" ? "#60A5FA" : "#aaa"} />
        </TouchableOpacity>
      </View>
      {/* Animation de transition */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {mode === "motard" ? <ExploreMotoScreen /> : <ExploreVoitureScreen />}
      </Animated.View>
    </View>
  );
}
