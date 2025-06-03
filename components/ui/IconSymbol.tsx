import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

// Icônes adaptées à chaque tab/navigation principale
const MAPPING = {
  'house.fill': 'home',                     // Accueil
  'radar': 'radar',                         // Détection/Explore
  'groups.fill': 'groups',                  // Communauté
  'star.circle.fill': 'workspace-premium',  // Premium (material 3)
  'settings': 'settings',                   // Paramètres
  'paperplane.fill': 'send',                // Ex. bouton feedback
  'chevron.right': 'chevron-right',         // Navigation interne
  'diamond.fill': 'diamond',                // Autre icône premium (option)
  'motorcycle': 'two-wheeler',              // Moto, spécifique
} as const;

// La seule et unique export du type
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Icône cross-platform pour navigation et UI.
 * - Utilise SF Symbols sur iOS, MaterialIcons sinon.
 */
export function IconSymbol({
  name,
  size = 24,
  color = '#222',
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] || 'help-outline'}
      style={style}
    />
  );
}
