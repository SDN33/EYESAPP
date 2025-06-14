// Ici tu pourras brancher Firebase/Amplitude plus tard
import { AnalyticsEvent } from "../types/analytics";
import { withAnalyticsConsent } from "../utils/analyticsConsent";

export async function logEvent(event: string, params?: Record<string, any>) {
  await withAnalyticsConsent(async () => {
    // Pour le MVP, juste un console.log
    console.log(`[Analytics] ${event}`, params || "");
    // Plus tard : Firebase.analytics().logEvent(event, params)
  });
}
