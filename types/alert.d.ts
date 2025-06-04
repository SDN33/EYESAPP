// types/alert.d.ts

export type AlertType = "distance" | "angle-mort" | "collision" | "vitesse" | "custom";

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: number;
  userId?: string;
  coords?: { lat: number; lon: number };
  extra?: Record<string, any>;
}
