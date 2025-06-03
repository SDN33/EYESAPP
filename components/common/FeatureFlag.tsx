import React from "react";
import { View } from "react-native";
import { usePremium } from "../../hooks/usePremium";

type Props = { children: React.ReactNode };

export default function FeatureFlag({ children }: Props) {
  const { isPremium } = usePremium();
  if (!isPremium) return null;
  return <View>{children}</View>;
}
