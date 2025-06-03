import { getItem, setItem, removeItem } from "./storage";

const USER_KEY = "userProfile";

export async function getUser(): Promise<{ id: string; name: string } | null> {
  const value = await getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}

export async function setUser(user: { id: string; name: string } | null) {
  if (!user) return removeItem(USER_KEY);
  await setItem(USER_KEY, JSON.stringify(user));
}
