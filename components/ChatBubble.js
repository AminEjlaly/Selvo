import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChatBubble({ text, isUser }) {
  return (
    <View style={[styles.row, isUser ? styles.right : styles.left]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 4,
  },
  left: {
    justifyContent: "flex-start",
  },
  right: {
    justifyContent: "flex-end",
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#101279ff",
    borderBottomRightRadius: 3,
  },
  bot: {
    backgroundColor: "#f1f2f7",
    borderBottomLeftRadius: 3,
  },
  text: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#101279ff",
  },
});
