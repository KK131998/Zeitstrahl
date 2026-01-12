// app/index.tsx
import { StyleSheet, View, Text, Pressable, Animated } from "react-native";
import { useRef, useState } from "react";

function FlipCard() {
  const rotation = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const flip = () => {
    Animated.timing(rotation, {
      toValue: flipped ? 0 : 180,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setFlipped((v) => !v);
  };

  const frontStyle = {
    transform: [
      {
        rotateY: rotation.interpolate({
          inputRange: [0, 180],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  const backStyle = {
    transform: [
      {
        rotateY: rotation.interpolate({
          inputRange: [0, 180],
          outputRange: ["180deg", "360deg"],
        }),
      },
    ],
  };

  return (
    <Pressable onPress={flip}>
      <View style={styles.cardContainer}>
        {/* Vorderseite */}
        <Animated.View style={[styles.card, styles.front, frontStyle]}>
          <Text style={styles.question}>
            Wann begann die Französische Revolution?
          </Text>
          <Text style={styles.hint}>Tippe, um die Antwort zu sehen</Text>
        </Animated.View>

        {/* Rückseite */}
        <Animated.View style={[styles.card, styles.back, backStyle]}>
          <Text style={styles.answer}>1789</Text>
          <Text style={styles.hint}>Tippe, um zurückzugehen</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export default function Index() {
  return (
    <View style={styles.container}>
      <FlipCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  cardContainer: {
    height: 220, // wichtig: sonst sieht man die Karte nicht sauber
  },

  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden", // wichtig fürs Flippen
  },

  front: {
    backgroundColor: "#fff",
  },

  back: {
    backgroundColor: "#f3f3f3",
  },

  question: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 32,
    color: "#111",
    fontWeight: "600",
  },

  answer: {
    textAlign: "center",
    fontSize: 42,
    lineHeight: 48,
    color: "#111",
    fontWeight: "800",
  },

  hint: {
    marginTop: 14,
    fontSize: 14,
    color: "#666",
  },
});
