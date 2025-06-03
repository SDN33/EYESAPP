import { getItem, setItem } from "./storage";

const PREMIUM_KEY = "userPremium";

export async function getPremiumStatus(): Promise<boolean> {
  const value = await getItem(PREMIUM_KEY);
  return value === "true";
}

export async function setPremiumStatus(isPremium: boolean) {
  await setItem(PREMIUM_KEY, isPremium ? "true" : "false");
}
