import { AnalyticsEvent } from "../types/analytics";

export const mockAnalytics: AnalyticsEvent[] = [
  { name: "app_open", timestamp: Date.now(), userId: "u1" },
  { name: "gps_alert_triggered", timestamp: Date.now(), userId: "u2", params: { distance: 45 } },
];
