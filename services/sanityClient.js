import { createClient } from '@sanity/client';
import Constants from 'expo-constants';

const SANITY_TOKEN = Constants.expoConfig?.extra?.SANITY_TOKEN || process.env.SANITY_TOKEN;

const client = createClient({
  projectId: 'o23wpsz2', // Remplacez par votre ID de projet
  dataset: 'production', // Remplacez par votre nom de dataset
  apiVersion: '2025-06-04', // Utilisez la date actuelle (YYYY-MM-DD)
  useCdn: true, // Utilise le CDN pour des performances optimales
  token: SANITY_TOKEN, // à ajouter si dataset privé
});

export default client;
