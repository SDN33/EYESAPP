import { useEffect, useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithProvider, signOut, getUser } from "../services/auth";

export function useAuth() {
  const [user, setUserState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then(u => {
      setUserState(u);
      setLoading(false);
    });
    // Écoute les changements d'auth Supabase
    const { data: listener } = (window as any).supabase?.auth.onAuthStateChange?.((event: string, session: any) => {
      getUser().then(setUserState);
    }) || { data: null };
    return () => listener?.unsubscribe?.();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await signInWithEmail(email, password);
    if (!error) setUserState(data.user);
    return { data, error };
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await signUpWithEmail(email, password);
    if (!error) setUserState(data.user);
    return { data, error };
  };

  const loginWithProvider = async (provider: 'google' | 'apple') => {
    return signInWithProvider(provider);
  };

  const logoutUser = async () => {
    await signOut();
    setUserState(null);
  };

  return { user, loading, login, signup, loginWithProvider, logout: logoutUser };
}
