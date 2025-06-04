import { createClient } from '@sanity/client';
import Constants from 'expo-constants';

// Ne jamais exposer le token côté client (web/mobile)
const isServer = typeof window === 'undefined' || typeof document === 'undefined';
const SANITY_TOKEN = isServer
  ? (Constants.expoConfig?.extra?.SANITY_TOKEN || process.env.SANITY_TOKEN)
  : undefined;

const client = createClient({
  projectId: 'o23wpsz2', // Remplacez par votre ID de projet
  dataset: 'production', // Remplacez par votre nom de dataset
  apiVersion: '2025-06-04', // Utilisez la date actuelle (YYYY-MM-DD)
  useCdn: true, // Utilise le CDN pour des performances optimales
  // Token uniquement côté serveur
  ...(SANITY_TOKEN ? { token: SANITY_TOKEN } : {}),
});

export default client;
