import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userConsent").then(val => {
      setHasConsent(val === "true");
    });
  }, []);

  const acceptConsent = async () => {
    await AsyncStorage.setItem("userConsent", "true");
    setHasConsent(true);
  };

  return { hasConsent, acceptConsent };
}
