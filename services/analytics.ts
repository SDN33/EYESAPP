export function logEvent(event: string, params?: any) {
    // Tu pourras brancher Firebase, Amplitude, etc ici
    console.log("[Analytics] Event:", event, params || "");
  }
  