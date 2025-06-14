import { supabase } from './supabase';

// Authentification par email/password
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

// Authentification via Google/Apple (OAuth)
export async function signInWithProvider(provider: 'google' | 'apple') {
  return supabase.auth.signInWithOAuth({ provider });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
