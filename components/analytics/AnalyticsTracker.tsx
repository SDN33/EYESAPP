import { useEffect } from "react";
import { logEvent } from "../../services/analytics";

// Props: eventName (string)
export default function AnalyticsTracker({ event }: { event: string }) {
  useEffect(() => {
    logEvent(event);
  }, [event]);
  return null;
}
