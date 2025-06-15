import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Animated, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LOGO = require('../../assets/images/EYES_Horizontal.pdf-removebg-preview.png');

export type ModeType = '2roues' | 'auto';

export default function ModeTutorial({ visible, onConfirm, onSelect }: { visible: boolean, onConfirm: (mode: ModeType) => void, onSelect?: (mode: ModeType) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState<ModeType>('2roues');

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Reset selection on open
  useEffect(() => {
    if (visible) setSelected('2roues');
  }, [visible]);

  // Pré-chargement du mode dès la sélection
  const handleSelect = (mode: ModeType) => {
    setSelected(mode);
    if (onSelect) onSelect(mode);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>  
        <View style={styles.tutoBox}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={[
                styles.iconWrap,
                selected === '2roues' && { backgroundColor: '#A259FF', borderColor: '#fff', shadowColor: '#A259FF', shadowOpacity: 0.18, shadowRadius: 8 },
                { marginRight: 18 }
              ]}
              onPress={() => handleSelect('2roues')}
              activeOpacity={0.8}
            >
              <Ionicons name="bicycle" size={selected === '2roues' ? 48 : 36} color={selected === '2roues' ? '#fff' : '#A259FF'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconWrap,
                selected === 'auto'
                  ? { backgroundColor: '#60A5FA', borderColor: '#fff', shadowColor: '#60A5FA', shadowOpacity: 0.18, shadowRadius: 8 }
                  : {},
                selected === 'auto' && { /* override violet bg if present */ backgroundColor: '#60A5FA' },
                { marginLeft: 18 }
              ]}
              onPress={() => handleSelect('auto')}
              activeOpacity={0.8}
            >
              <Ionicons name="car" size={selected === 'auto' ? 48 : 36} color={selected === 'auto' ? '#fff' : '#60A5FA'} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Bienvenue sur Eyes</Text>
          <Text style={styles.subtitle}>Choisissez votre mode</Text>
          <Text style={styles.text}>
            Choisissez votre mode pour une expérience adaptée à votre conduite :
          </Text>
          <Text style={styles.text}>
            <Text style={{color:'#A259FF',fontWeight:'bold'}}>2 Roues</Text> : Alertes dangers, angle d’inclinaison, communauté motarde.
            {'\n'}
            <Text style={{color:'#60A5FA',fontWeight:'bold'}}>Auto</Text> : Trafic en temps réel, alertes sécurité, GPS intelligent.
          </Text>
          <View style={styles.tutoTipBox}>
            <Ionicons name="information-circle" size={20} color="#A259FF" style={{marginRight:6}} />
            <Text style={styles.tutoTip}>Vous pouvez changer de mode à tout moment dans les paramètres ou sur l’accueil.</Text>
          </View>
          <TouchableOpacity style={[styles.button, selected === 'auto' && { backgroundColor: '#60A5FA' }]} onPress={() => onConfirm(selected)}>
            <Text style={styles.buttonText}>Valider le mode {selected === '2roues' ? '2 roues' : 'Auto'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutoBox: {
        backgroundColor: '#23242A',
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        maxWidth: 360,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
    },
    logo: {
        width: 220, // augmenté
        height: 110, // augmenté
        marginBottom: 18,
        borderRadius: 18,
        shadowColor: '#A259FF',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        backgroundColor: '#23242A',
        padding: 8,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    iconWrap: {
        backgroundColor: '#181A20',
        borderRadius: 12,
        padding: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    iconSelected: {
        // backgroundColor: '#A259FF', // SUPPRIMÉ pour éviter violet sur auto
        borderColor: '#fff',
        shadowColor: '#A259FF',
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 24,
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontWeight: '600',
        fontSize: 19,
        color: '#60A5FA',
        marginBottom: 8,
        textAlign: 'center',
    },
    text: {
        fontSize: 16,
        color: '#e5e7eb',
        marginBottom: 10,
        textAlign: 'center',
    },
    tutoTipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181A20',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        marginTop: 2,
        maxWidth: 260,
    },
    tutoTip: {
        color: '#A259FF',
        fontSize: 14,
        flex: 1,
        textAlign: 'left',
    },
    button: {
        marginTop: 18,
        backgroundColor: '#A259FF',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 32,
        shadowColor: '#A259FF',
        shadowOpacity: 0.13,
        shadowRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
