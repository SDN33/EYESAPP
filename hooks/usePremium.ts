import { useEffect, useState } from "react";
import { getPremiumStatus, setPremiumStatus } from "../services/premium";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    getPremiumStatus().then(setIsPremium);
  }, []);

  const upgrade = async () => {
    await setPremiumStatus(true);
    setIsPremium(true);
  };

  const downgrade = async () => {
    await setPremiumStatus(false);
    setIsPremium(false);
  };

  return { isPremium, upgrade, downgrade };
}
