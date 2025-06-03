import { useState } from "react";
import { getUser, setUser } from "../services/auth";

export function useAuth() {
  const [user, setUserState] = useState<{ id: string; name: string } | null>(null);

  // Simule l'obtention d'un user, ou un login
  const login = async (name: string) => {
    const newUser = { id: "user-" + Date.now(), name };
    await setUser(newUser);
    setUserState(newUser);
  };

  const loadUser = async () => {
    const existing = await getUser();
    if (existing) setUserState(existing);
  };

  const logout = async () => {
    await setUser(null);
    setUserState(null);
  };

  return { user, login, logout, loadUser };
}
