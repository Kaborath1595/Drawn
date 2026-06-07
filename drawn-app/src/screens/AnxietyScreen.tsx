import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from "react-native";
import { deleteToken } from '../services/storage';
import { registerClick } from "../services/api";
import {
  enqueueClick,
  getPendingCount,
  startQueueListener,
} from "../services/clickQueue";

interface Props {
  onLogout: () => void;
}

export default function AnxietyScreen({ onLogout }: Props) {
  const [pending, setPending] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;

  const refreshPending = useCallback(async () => {
    setPending(await getPendingCount());
  }, []);

  useEffect(() => {
    refreshPending();
    const unsubscribe = startQueueListener(refreshPending);
    return unsubscribe;
  }, [refreshPending]);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = async () => {
    animatePress();
    try {
      await registerClick();
    } catch {
      await enqueueClick();
      await refreshPending();
    }
  };

  const handleLogout = async () => {
    await deleteToken();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Salir</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.anxietyButton}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Tengo{"\n"}ansiedad</Text>
        </TouchableOpacity>
      </Animated.View>

      {pending > 0 && (
        <Text style={styles.pendingText}>Se enviará cuando haya señal</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
  },
  logoutBtn: {
    position: "absolute",
    top: 52,
    right: 24,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  anxietyButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
  buttonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 38,
  },
  pendingText: {
    position: "absolute",
    bottom: 48,
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "500",
  },
});
