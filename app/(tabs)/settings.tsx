// app/(tabs)/settings.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Switch, Animated, Platform, ScrollView, TextInput, Modal, ActivityIndicator, Dimensions } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { usePremium } from "../../hooks/usePremium";
import { useConsent } from "../../hooks/useConsent";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeMode } from '../../hooks/ThemeContext';
import { useTrafficLayer } from '../../hooks/useTrafficLayer';
import { supabase } from '../../services/supabase';
import { getCurrentSession, getDisplayName, setDisplayName as setDisplayNameUtil, persistSession, restoreSession, logoutAndClearSession } from '../../utils/authSession';
import SignUpModal from '../../components/common/SignUpModal';
import { setAnalyticsConsent, hasAnalyticsConsent } from '../../utils/analyticsConsent';

// Animation shimmer simple (avatar)
function ShimmerAvatar() {
  return (
    <View style={{
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: "#3a3990", alignItems: "center", justifyContent: "center",
      overflow: "hidden"
    }}>
      <Animated.View
        style={{
          position: "absolute", width: 90, height: 90, borderRadius: 45,
          backgroundColor: "#3a3990", opacity: 0.5
        }}
      />
      <Ionicons name="person-outline" size={40} color="#6366f1" />
    </View>
  );
}

// Ajout d'un message d'accueil dynamique
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function SettingsScreen() {
  // Centralisation de la gestion session/displayName
  const [session, setSession] = useState<any>(null);
  const [displayName, setDisplayNameState] = useState<string>("Utilisateur invité");
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [editNameLoading, setEditNameLoading] = useState(false);
  const { mode: themeMode, setMode: setThemeMode, colorScheme: _colorScheme } = useThemeMode();
  const colorScheme = _colorScheme || 'light';
  const textColor = Colors[colorScheme].text;
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const profileAnim = useRef(new Animated.Value(0)).current;
  const [showEditName, setShowEditName] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const headerPaddingTop = screenHeight < 700 ? 16 : 36;

  useEffect(() => {
    if (session && session.user) {
      setJustLoggedIn(true);
      Animated.timing(profileAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setJustLoggedIn(false));
    } else {
      profileAnim.setValue(0);
    }
  }, [session]);

  // Listener global Supabase Auth
  useEffect(() => {
    let isMounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setSession(session);
      if (session && session.user) {
        const name = await getDisplayName();
        if (isMounted) setDisplayNameState(name || session.user.email || "Utilisateur invité");
      } else {
        if (isMounted) setDisplayNameState("Utilisateur invité");
      }
    });
    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Edition du display name (Auth uniquement)
  const handleEditName = async (newName: string) => {
    setEditNameError(null);
    setEditNameLoading(true);
    try {
      if (!newName) {
        setEditNameError("Le nom ne peut pas être vide.");
        setEditNameLoading(false);
        return;
      }
      try {
        await setDisplayNameUtil(newName);
        setDisplayNameState(newName);
        setShowEditName(false);
      } catch (error: any) {
        setEditNameError(error.message || 'Erreur inconnue');
      }
    } catch (e: any) {
      setEditNameError(e?.message || 'Erreur inconnue');
    }
    setEditNameLoading(false);
  };

  // Déconnexion centralisée
  const handleLogout = async () => {
    await logoutAndClearSession();
    setSession(null);
    setDisplayNameState("Utilisateur invité");
  };

  const { user, loading, login, signup, loginWithProvider, logout } = useAuth();
  const { isPremium, upgrade } = usePremium();
  const { hasConsent, acceptConsent } = useConsent();
  const [showTraffic, setShowTraffic, loadingTraffic] = useTrafficLayer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);

  // Affiche le display name du profil auth (prioritaire)
  const displayNameFinal = session && session.user ? displayName : user?.user_metadata?.display_name || user?.email || "Utilisateur invité";

  // Fonction utilitaire pour valider la robustesse du mot de passe
  function isStrongPassword(pwd: string) {
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pwd);
  }

  // Indicateur de robustesse du mot de passe
  function getPasswordStrength(pwd: string) {
    if (!pwd) return { label: '', color: '' };
    if (pwd.length < 8) return { label: 'Trop court', color: '#ef4444' };
    let score = 0;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Faible', color: '#f59e42' };
    if (score === 3) return { label: 'Moyen', color: '#eab308' };
    if (score === 4) return { label: 'Solide', color: '#10b981' };
    return { label: '', color: '' };
  }

  // Indicateur de robustesse du mot de passe (barre visuelle)
  function getPasswordStrengthLevel(pwd: string) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
    return score; // 0 à 5
  }

  // Fonction de connexion (email + mot de passe, Auth uniquement, jamais username ni table users)
  const handleLogin = async () => {
    setError(null);
    try {
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) {
        setError(loginErr.message);
        return;
      }
      setShowSignUp(false);
      setEmail("");
      setPassword("");
      // Le listener global s'occupe de la session
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    }
  };

  // Consentement RGPD (synchronisé avec analyticsConsent)
  const [analyticsConsent, setAnalyticsConsentState] = useState<boolean>(false);

  // Active par défaut le consentement si login
  useEffect(() => {
    hasAnalyticsConsent().then(val => {
      if (session && session.user) {
        // Si login et pas encore consenti, on active par défaut
        if (!val) {
          setAnalyticsConsent(true);
          setAnalyticsConsentState(true);
        } else {
          setAnalyticsConsentState(val);
        }
      } else {
        setAnalyticsConsentState(val);
      }
    });
  }, [session]);

  const handleConsentChange = async () => {
    const newValue = !analyticsConsent;
    await setAnalyticsConsent(newValue);
    setAnalyticsConsentState(newValue);
    acceptConsent(); // Toujours appeler pour rester compatible avec le contexte
  };

  // UI variante : connecté (nouvel affichage épuré)
  if (session && session.user) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={{ flexGrow: 1 }}>
        <Animated.View
          style={{
            flex: 1,
            opacity: profileAnim,
            transform: [{ scale: profileAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
          }}
        >
          {/* Header moderne */}
          <View style={{ paddingTop: headerPaddingTop, paddingBottom: 18, alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#232650' : '#ede9fe', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
            <Ionicons name="settings-outline" size={38} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colorScheme === 'dark' ? '#fff' : '#3a3990', letterSpacing: 0.5 }}>Paramètres</Text>
            <Text style={{ color: colorScheme === 'dark' ? '#a5b4fc' : '#6366f1', fontSize: 16, marginTop: 2 }}>{getGreeting()} 👋</Text>
          </View>
          {/* Avatar / Profil */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{
              width: 90, height: 90, borderRadius: 45,
              backgroundColor: colorScheme === 'dark' ? "#3a3990" : "#f3f4f6", alignItems: "center", justifyContent: "center",
              borderWidth: 3,
              borderColor: "#a78bfa"
            }}>
              <Text style={{ fontSize: 38, color: "#7dd3fc", fontWeight: "bold" }}>
                {displayName?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
            <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "bold", color: textColor, textAlign: "center" }}>
              {displayName}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 10, alignItems: 'center', flexDirection: 'row', gap: 6 }}
              onPress={() => setShowEditName(true)}
              accessibilityLabel="Modifier le nom"
            >
              <Ionicons name="pencil-outline" size={16} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} />
              <Text style={{ color: colorScheme === 'dark' ? '#a78bfa' : '#6366f1', fontWeight: 'bold', fontSize: 15 }}>
                Modifier mon nom
              </Text>
            </TouchableOpacity>
          </View>
          {/* Modal édition nom minimaliste */}
          <Modal visible={showEditName} transparent animationType="fade" onRequestClose={() => setShowEditName(false)}>
            <View style={{ flex:1, backgroundColor:'#000B', justifyContent:'center', alignItems:'center' }}>
              <View style={{ backgroundColor: colorScheme === 'dark' ? '#3a3990' : '#fff', borderRadius:16, padding:22, minWidth:260, width:320, alignItems:'center' }}>
                <Text style={{ color: textColor, fontWeight:'bold', fontSize:18, marginBottom:16 }}>Votre nom</Text>
                <TextInput
                  placeholder="Pseudonyme ou nom complet"
                  defaultValue={displayName}
                  onChangeText={setDisplayNameState}
                  autoCapitalize="words"
                  placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
                  style={{ width:'100%', marginBottom:10, padding:10, borderRadius:8, borderWidth:1, borderColor:'#ccc', backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f3f4f6', color: colorScheme === 'dark' ? '#fff' : '#3a3990' }}
                />
                {editNameError && <Text style={{ color:'#ef4444', marginBottom:8 }}>{editNameError}</Text>}
                <TouchableOpacity onPress={() => handleEditName(displayName)} disabled={editNameLoading || !displayName} style={{ backgroundColor:!displayName? '#aaa' : '#6366f1', borderRadius:8, paddingVertical:12, paddingHorizontal:32, marginTop:8, alignItems:'center', width:'100%' }}>
                  <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16 }}>{editNameLoading ? 'Enregistrement...' : 'Enregistrer'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEditName(false)} style={{ marginTop: 10 }}>
                  <Text style={{ color: colorScheme === 'dark' ? '#aaa' : '#3a3990', fontSize: 14 }}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* Préférences, RGPD, Premium, À propos, Footer... */}
          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: colorScheme === 'dark' ? '#3a3990' : '#e5e7eb', marginVertical: 12 }} />
          {/* Bloc déconnexion */}
          <View style={{ marginBottom: 18 }}>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: colorScheme === 'dark' ? "#3a3990" : "#e0e7ef", borderRadius: 8, padding: 14, alignItems: "center"
              }}>
              <Text style={{ color: colorScheme === 'dark' ? "#f472b6" : "#be185d", fontWeight: "bold", fontSize: 16 }}>
                <Ionicons name="log-out-outline" size={18} /> Se déconnecter
              </Text>
            </TouchableOpacity>
          </View>
          {/* Premium */}
          {!isPremium && (
            <View style={{
              backgroundColor: colorScheme === 'dark' ? '#312e81' : '#ede9fe',
              borderRadius: 10,
              padding: 18,
              alignItems: 'center',
              marginBottom: 18,
              borderWidth: 1.5,
              borderColor: colorScheme === 'dark' ? '#a78bfa' : '#a78bfa33',
              shadowColor: colorScheme === 'dark' ? '#000' : '#aaa',
              shadowOpacity: 0.10,
              shadowRadius: 8,
              elevation: 2
            }}>
              <Ionicons name="diamond-outline" size={32} color={colorScheme === 'dark' ? '#fbbf24' : '#a78bfa'} style={{ marginBottom: 8 }} />
              <Text style={{ color: colorScheme === 'dark' ? '#fbbf24' : '#7c3aed', fontWeight: 'bold', fontSize: 18, marginBottom: 6, textAlign: 'center' }}>
                Premium bientôt disponible
              </Text>
              <Text style={{ color: textColor, fontSize: 15, textAlign: 'center', marginBottom: 10, opacity: 0.85 }}>
                La version Premium arrive très prochainement !
                Restez à l'écoute pour débloquer des fonctionnalités exclusives et soutenir le développement de l'application.
              </Text>
              <TouchableOpacity
                disabled
                style={{
                  backgroundColor: colorScheme === 'dark' ? '#7c3aed55' : '#a78bfa55',
                  borderRadius: 8,
                  padding: 14,
                  alignItems: 'center',
                  opacity: 0.6
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  <Ionicons name="lock-closed-outline" size={17} color="#fff" /> Passer Premium
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Consentement RGPD */}
          <View style={{
            backgroundColor: colorScheme === 'dark' ? "#232650" : "#e0e7ef", borderRadius: 8, padding: 16, marginBottom: 20,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between"
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Ionicons
                name={analyticsConsent ? "checkmark-circle" : "alert-circle-outline"}
                size={20}
                color={analyticsConsent ? "#60a5fa" : "#f59e42"}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: textColor }}>Partage de données anonymes</Text>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={handleConsentChange}
              trackColor={{ true: "#60a5fa", false: colorScheme === 'dark' ? "#555" : "#bbb" }}
              thumbColor={analyticsConsent ? "#60a5fa" : colorScheme === 'dark' ? "#888" : "#ccc"}
            />
          </View>

          {/* Sélecteur de mode d'affichage */}
          <View style={{
            backgroundColor: themeMode === 'dark'
              ? '#232650'
              : (themeMode === 'light' && colorScheme === 'light' ? '#ede9fe' : '#e0f2fe'),
            borderRadius: 8, padding: 16, marginBottom: 20,
            flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
            shadowColor: colorScheme === 'dark' ? '#000' : '#aaa',
            shadowOpacity: 0.08, shadowRadius: 6, elevation: 2
          }}>
            <Text
              style={{
                color: textColor,
                fontWeight: 'bold',
                fontSize: 16,
                marginBottom: 10
              }}
            >
              Apparence
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setThemeMode('system')}
                style={{
                  backgroundColor:
                    themeMode === 'system'
                      ? '#6366f1'
                      : (colorScheme === 'dark' ? '#232650' : '#f3f4f6'),
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16
                }}
              >
                <Text style={{ color: themeMode === 'system' ? '#fff' : textColor, fontWeight: 'bold' }}>
                  Système
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setThemeMode('light')}
                style={{
                  backgroundColor: themeMode === 'light' ? '#6366f1' : (colorScheme === 'dark' ? '#232650' : '#f3f4f6'),
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16
                }}
              >
                <Text style={{ color: themeMode === 'light' ? '#fff' : textColor, fontWeight: 'bold' }}>
                  Clair
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setThemeMode('dark')}
                style={{
                  backgroundColor: themeMode === 'dark' ? '#6366f1' : (colorScheme === 'dark' ? '#232650' : '#f3f4f6'),
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16
                }}
              >
                <Text style={{ color: themeMode === 'dark' ? '#fff' : textColor, fontWeight: 'bold' }}>
                  Sombre
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Couche de trafic */}
          <View style={{
            backgroundColor: colorScheme === 'dark' ? "#232650" : "#e0e7ef", borderRadius: 8, padding: 16, marginBottom: 20,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between"
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Ionicons
                name={showTraffic ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={showTraffic ? "#f59e42" : "#60a5fa"}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: textColor }}>Afficher les données de trafic</Text>
            </View>
            <Switch
              value={showTraffic}
              onValueChange={setShowTraffic}
              trackColor={{ true: "#60a5fa", false: colorScheme === 'dark' ? "#555" : "#bbb" }}
              thumbColor={showTraffic ? "#60a5fa" : colorScheme === 'dark' ? "#888" : "#ccc"}
            />
          </View>

          {/* À propos */}
          <View style={{
            backgroundColor: colorScheme === 'dark' ? "#232650" : "#e0e7ef", borderRadius: 8, padding: 16,
            flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
            shadowColor: colorScheme === 'dark' ? '#000' : '#aaa',
            shadowOpacity: 0.08, shadowRadius: 6, elevation: 2
          }}>
            <Text
              style={{
                color: textColor,
                fontWeight: 'bold',
                fontSize: 16,
                marginBottom: 12
              }}
            >
              À propos de l'application
            </Text>
            <Text style={{ color: textColor, lineHeight: 18, marginBottom: 12 }}>
              Cette application utilise des données de trafic en temps réel pour vous fournir des informations précieuses sur l'état du réseau.
            </Text>
            <Text style={{ color: textColor, lineHeight: 18, marginBottom: 12 }}>
              Nous nous engageons à protéger votre vie privée. Aucune donnée personnelle n'est collectée sans votre consentement.
            </Text>
            <TouchableOpacity
              onPress={() => {
                // Ouvrir les mentions légales
              }}
              style={{
                marginTop: 8,
                backgroundColor: colorScheme === 'dark' ? "#7c3aed" : "#a78bfa",
                borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
                Mentions légales
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer version/logo */}
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 8, opacity: 0.7 }}>
            <Ionicons name="logo-react" size={18} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} style={{ marginBottom: 2 }} />
            <Text style={{ color: textColor, fontSize: 13 }}>
              Version 1.0.0
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    );
  }

  // Variante : non connecté (affiche uniquement la zone login/signup, sans Google/Apple)
  if (!session || !session.user) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header moderne */}
        <View style={{ paddingTop: headerPaddingTop, paddingBottom: 18, alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#232650' : '#ede9fe', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
          <Ionicons name="settings-outline" size={38} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} style={{ marginBottom: 6 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colorScheme === 'dark' ? '#fff' : '#3a3990', letterSpacing: 0.5 }}>Paramètres</Text>
          <Text style={{ color: colorScheme === 'dark' ? '#a5b4fc' : '#6366f1', fontSize: 16, marginTop: 2 }}>{getGreeting()} 👋</Text>
        </View>

        {/* Section Mon compte (invité) */}
        <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 18 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colorScheme === 'dark' ? '#232650' : '#e0e7ef', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
            <Ionicons name="person-circle-outline" size={70} color={colorScheme === 'dark' ? '#6366f1' : '#a78bfa'} />
          </View>
          <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "bold", color: textColor, textAlign: 'center', letterSpacing: 0.2 }}>Invité</Text>
        </View>

        {/* Card Connexion/Inscription */}
        <View style={{ marginHorizontal: 18, marginBottom: 22, backgroundColor: colorScheme === 'dark' ? '#232650' : '#fff', borderRadius: 18, padding: 22, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, elevation: 3 }}>
          <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 17, marginBottom: 10, letterSpacing: 0.2 }}>Connexion / Inscription</Text>
          <View style={{ flexDirection: 'column', gap: 8 }}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colorScheme === 'dark' ? '#a5b4fc' : '#888'}
              style={{ width:'100%', marginBottom:10, padding:12, borderRadius:10, borderWidth:1.5, borderColor:'#a78bfa', backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f3f4f6', color: textColor, fontSize:16, fontWeight:'500', shadowColor:'#a78bfa', shadowOpacity:0.06, shadowRadius:4 }}
              selectionColor={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'}
            />
            <TextInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colorScheme === 'dark' ? '#a5b4fc' : '#888'}
              style={{ width:'100%', marginBottom:10, padding:12, borderRadius:10, borderWidth:1.5, borderColor:'#a78bfa', backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f3f4f6', color: textColor, fontSize:16, fontWeight:'500', shadowColor:'#a78bfa', shadowOpacity:0.06, shadowRadius:4 }}
              selectionColor={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'}
            />
            {error && <Text style={{ color:'#ef4444', marginBottom:8, fontWeight:'bold' }}>{error}</Text>}
            <TouchableOpacity onPress={handleLogin} disabled={loading || !email || !password} style={{ backgroundColor:!email||!password? '#aaa' : '#6366f1', borderRadius:12, paddingVertical:14, paddingHorizontal:32, marginTop:8, alignItems:'center', width:'100%', shadowColor:'#6366f1', shadowOpacity:0.13, shadowRadius:6, elevation:2, opacity:loading ? 0.7 : 1 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontWeight:'bold', fontSize:17, letterSpacing:0.2 }}>Se connecter</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSignUp(true)} style={{ marginTop: 12, alignSelf: 'center' }}>
              <Text style={{ color: colorScheme === 'dark' ? '#a78bfa' : '#7c3aed', fontWeight: 'bold', fontSize: 16, letterSpacing:0.2 }}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal d'inscription moderne avec animation d'apparition */}
        <Animated.View style={{ opacity: showSignUp ? 1 : 0, transform: [{ scale: showSignUp ? 1 : 0.96 }], position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }} pointerEvents={showSignUp ? 'auto' : 'none'}>
          <SignUpModal
            visible={showSignUp}
            onClose={() => setShowSignUp(false)}
            onSuccess={async () => {
              setShowSignUp(false);
              await restoreSession();
            }}
          />
        </Animated.View>

        {/* Séparateur élégant */}
        <View style={{ height: 1.5, backgroundColor: colorScheme === 'dark' ? '#3a3990' : '#e5e7eb', marginVertical: 18, marginHorizontal: 24, borderRadius: 2 }} />

        {/* Préférences */}
        <View style={{ marginHorizontal: 18, marginBottom: 22, backgroundColor: colorScheme === 'dark' ? '#232650' : '#f3f4f6', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="options-outline" size={22} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} style={{ marginRight: 8 }} />
            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 17, letterSpacing: 0.2 }}>Préférences</Text>
          </View>

          {/* Sélecteur de mode d'affichage */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: textColor, fontWeight: '600', fontSize: 15, marginBottom: 6 }}>Apparence</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setThemeMode('system'); }}
                style={{
                  backgroundColor: themeMode === 'system' ? '#6366f1' : (colorScheme === 'dark' ? '#232650' : '#f3f4f6'),
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  marginRight: 6,
                  borderWidth: themeMode === 'system' ? 2 : 1,
                  borderColor: themeMode === 'system' ? '#a78bfa' : '#ccc',
                }}
              >
                <Text style={{ color: themeMode === 'system' ? '#fff' : textColor, fontWeight: 'bold' }}>Système</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setThemeMode('light'); }}
                style={{
                  backgroundColor: themeMode === 'light' ? '#6366f1' : (colorScheme === 'dark' ? '#232650' : '#f3f4f6'),
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  marginRight: 6,
                  borderWidth: themeMode === 'light' ? 2 : 1,
                  borderColor: themeMode === 'light' ? '#a78bfa' : '#ccc',
                }}
              >
                <Text style={{ color: themeMode === 'light' ? '#fff' : textColor, fontWeight: 'bold' }}>Clair</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setThemeMode('dark'); }}
                style={{
                  backgroundColor: themeMode === 'dark' ? '#6366f1' : (colorScheme === 'dark' ? '#232650' : '#f3f4f6'),
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderWidth: themeMode === 'dark' ? 2 : 1,
                  borderColor: themeMode === 'dark' ? '#a78bfa' : '#ccc',
                }}
              >
                <Text style={{ color: themeMode === 'dark' ? '#fff' : textColor, fontWeight: 'bold' }}>Sombre</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch couche trafic */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={showTraffic ? 'eye-outline' : 'eye-off-outline'} size={20} color={showTraffic ? '#60a5fa' : '#aaa'} style={{ marginRight: 8 }} />
              <Text style={{ color: textColor, fontSize: 15 }}>Afficher la couche trafic sur la carte</Text>
            </View>
            <Switch
              value={showTraffic}
              onValueChange={v => { setShowTraffic(v); }}
              trackColor={{ true: '#60a5fa', false: colorScheme === 'dark' ? '#555' : '#bbb' }}
              thumbColor={showTraffic ? '#60a5fa' : colorScheme === 'dark' ? '#888' : '#ccc'}
            />
          </View>
        </View>

        {/* À propos */}
        <View style={{ marginHorizontal: 18, marginBottom: 32, backgroundColor: colorScheme === 'dark' ? '#232650' : '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="information-circle-outline" size={22} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} style={{ marginRight: 8 }} />
            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 17, letterSpacing: 0.2 }}>À propos</Text>
          </View>
          <Text style={{ color: textColor, lineHeight: 18, marginBottom: 12 }}>
            Cette application utilise des données de trafic en temps réel pour vous fournir des informations précieuses sur l'état du réseau.
          </Text>
          <Text style={{ color: textColor, lineHeight: 18, marginBottom: 12 }}>
            Nous nous engageons à protéger votre vie privée. Aucune donnée personnelle n'est collectée sans votre consentement.
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Ouvrir les mentions légales
            }}
            style={{
              marginTop: 8,
              backgroundColor: colorScheme === 'dark' ? "#7c3aed" : "#a78bfa",
              borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
              Mentions légales
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer version/logo */}
        <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 8, opacity: 0.7 }}>
          <Ionicons name="logo-react" size={18} color={colorScheme === 'dark' ? '#a78bfa' : '#6366f1'} style={{ marginBottom: 2 }} />
          <Text style={{ color: textColor, fontSize: 13 }}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    );
  }
}
