// Liste les events que tu vas tracker partout dans l'app
export const AnalyticsEvents = {
    APP_OPEN: "app_open",
    LOGIN: "login",
    LOGOUT: "logout",
    ACCEPT_CONSENT: "accept_consent",
    GPS_ALERT_TRIGGERED: "gps_alert_triggered",
    UPGRADE_PREMIUM: "upgrade_premium",
    ACCESS_COMMUNITY: "access_community",
    OPEN_TAB: (tabName: string) => `open_tab_${tabName}`,
  };
  