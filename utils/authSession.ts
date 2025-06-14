import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const SESSION_KEY = 'supabase_session';

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getDisplayName() {
  const session = await getCurrentSession();
  return session?.user?.user_metadata?.display_name || session?.user?.email || null;
}

export async function setDisplayName(newName: string) {
  const { data, error } = await supabase.auth.updateUser({ data: { display_name: newName } });
  if (error) throw error;
  // Met à jour le cache local si nécessaire (aucune session retournée ici)
  return data.user?.user_metadata?.display_name;
}

export async function persistSession(session: any) {
  if (session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export async function restoreSession() {
  const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    return session;
  }
  return null;
}

export async function logoutAndClearSession() {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem(SESSION_KEY);
}
