export type AnalyticsEvent = {
    name: string;
    timestamp: number;
    userId?: string;
    params?: Record<string, any>;
  };
  