// src/components/FloatingMenuButton.js
import { FontAwesome } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function FloatingMenuButton({ onPress }) {
  const [dragging, setDragging] = useState(false);
  const position = useRef(new Animated.ValueXY({ x: 20, y: 400 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // انیمیشن کلیک
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // درگ کردن دکمه
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        setDragging(false);

        Animated.spring(position, {
          toValue: { x: gesture.moveX < 200 ? 20 : 300, y: gesture.moveY },
          useNativeDriver: false,
          bounciness: 12,
        }).start();
      },
    })
  ).current;

  const spinAnim = useRef(new Animated.Value(0)).current;
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const triggerMenu = () => {
    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onPress && onPress());
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            ...position.getTranslateTransform(),
            { scale: scaleAnim },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={triggerMenu}
      >
        <Animated.View
          style={[styles.button, { transform: [{ rotate: spin }] }]}
        >
          <FontAwesome name="bars" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 99,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
