import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from "react-native";

type Props = {
    title: string;
    onPress: (e: GestureResponderEvent) => void;
    style?: any;
};

export default function Button({ title, onPress, style }: Props) {
    return (
        <TouchableOpacity style={[styles.btn, style]} onPress={onPress}>
            <Text style={styles.txt}>{title}</Text>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    btn: { backgroundColor: '#2196f3', padding: 12, borderRadius: 6 },
    txt: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});