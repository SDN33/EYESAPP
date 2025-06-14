import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = 'https://byazylnnhbszmzljaqht.supabase.co';
const supabaseAnonKey =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseKey ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);