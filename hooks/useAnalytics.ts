import { useCallback } from "react";
import { logEvent } from "../services/analytics";

export function useAnalytics() {
  // Permet de logger un event partout simplement
  return useCallback((event: string, params?: any) => {
    logEvent(event, params);
  }, []);
}
