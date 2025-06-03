import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useAnalytics } from "../../hooks/useAnalytics";
import { AnalyticsEvents } from "../../constants/AnalyticsEvents";

export default function ExploreScreen() {
  const track = useAnalytics();

  useEffect(() => {
    track(AnalyticsEvents.OPEN_TAB("explore"));
  }, []);

  return (
    <View>
      <Text>Détection Moto</Text>
    </View>
  );
}

