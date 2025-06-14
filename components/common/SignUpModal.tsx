import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useThemeMode } from '../../hooks/ThemeContext';
import { supabase } from '../../services/supabase';
import { setDisplayName as setDisplayNameUtil, persistSession } from '../../utils/authSession';

interface SignUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignUpModal({ visible, onClose, onSuccess }: SignUpModalProps) {
  const { colorScheme } = useThemeMode();
  const textColor = Colors[colorScheme].text;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));

  function isStrongPassword(pwd: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pwd);
  }

  const handleSignUp = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } }
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        setError('Erreur inconnue lors de la création du compte.');
        setLoading(false);
        return;
      }
      await setDisplayNameUtil(name);
      // Force la récupération de la session côté client (workaround Expo/Supabase)
      const { data: sessionData } = await supabase.auth.getSession();
      await persistSession(sessionData?.session || data.session || null);
      setSuccess(true);
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    }
    setLoading(false);
  };

  const resetState = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
    setSuccess(false);
    successAnim.setValue(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex:1, backgroundColor:'#000B', justifyContent:'center', alignItems:'center' }}>
        <View style={{ backgroundColor: colorScheme === 'dark' ? '#3a3990' : '#fff', borderRadius:16, padding:22, minWidth:280, width:340, alignItems:'center' }}>
          {!success ? (
            <>
              <Text style={{ color: textColor, fontWeight:'bold', fontSize:18, marginBottom:16 }}>Créer un compte</Text>
              <TextInput
                placeholder="Nom ou pseudonyme"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
                style={{ width:'100%', marginBottom:10, padding:10, borderRadius:8, borderWidth:1, borderColor:'#ccc', backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f3f4f6', color: colorScheme === 'dark' ? '#fff' : '#3a3990' }}
              />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
                style={{ width:'100%', marginBottom:10, padding:10, borderRadius:8, borderWidth:1, borderColor:'#ccc', backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f3f4f6', color: colorScheme === 'dark' ? '#fff' : '#3a3990' }}
              />
              <TextInput
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
                style={{ width:'100%', marginBottom:10, padding:10, borderRadius:8, borderWidth:1, borderColor:'#ccc', backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f3f4f6', color: colorScheme === 'dark' ? '#fff' : '#3a3990' }}
              />
              {error && <Text style={{ color:'#ef4444', marginBottom:8 }}>{error}</Text>}
              <TouchableOpacity onPress={handleSignUp} disabled={loading || !name || !email || !password} style={{ backgroundColor:!name||!email||!password? '#aaa' : '#6366f1', borderRadius:8, paddingVertical:12, paddingHorizontal:32, marginTop:8, alignItems:'center', width:'100%' }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16 }}>Créer un compte</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={{ marginTop: 10 }}>
                <Text style={{ color: colorScheme === 'dark' ? '#aaa' : '#3a3990', fontSize: 14 }}>Annuler</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
              <Animated.View style={{
                transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }],
                opacity: successAnim,
                marginBottom: 18
              }}>
                <Ionicons name="checkmark-circle" size={70} color="#10b981" />
              </Animated.View>
              <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
                Inscription réussie !
              </Text>
              <Text style={{ color: textColor, fontSize: 15, textAlign: 'center', marginBottom: 10 }}>
                Un email de confirmation a été envoyé à :
              </Text>
              <Text style={{ color: '#6366f1', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 18 }}>{email}</Text>
              <Text style={{ color: textColor, fontSize: 14, textAlign: 'center', marginBottom: 18 }}>
                Veuillez cliquer sur le lien dans l'email pour activer votre compte.
              </Text>
              <TouchableOpacity onPress={handleClose} style={{ backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, alignItems: 'center', width: '100%' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
