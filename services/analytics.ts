// Ici tu pourras brancher Firebase/Amplitude plus tard
import { AnalyticsEvent } from "../types/analytics";

export function logEvent(event: string, params?: Record<string, any>) {
  // Pour le MVP, juste un console.log
  console.log(`[Analytics] ${event}`, params || "");
  // Plus tard : Firebase.analytics().logEvent(event, params)
}
