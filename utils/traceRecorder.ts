// utils/traceRecorder.ts
// Utilitaire pour enregistrer le tracé GPS d'un trajet

import type { LocationObject } from 'expo-location';

export type TracePoint = { latitude: number; longitude: number; timestamp: number };

export class TraceRecorder {
  private trace: TracePoint[] = [];
  private isRecording = false;

  start() {
    this.trace = [];
    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;
    return this.trace;
  }

  addPoint(location: LocationObject) {
    if (!this.isRecording) return;
    this.trace.push({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Date.now(),
    });
  }

  getTrace() {
    return this.trace;
  }

  isActive() {
    return this.isRecording;
  }
}
