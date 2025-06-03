import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(o => !o)}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{open ? "▼" : "►"} {title}</Text>
      </TouchableOpacity>
      {open && <View style={{ paddingLeft: 12 }}>{children}</View>}
    </View>
  );
}
