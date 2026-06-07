import React, { useState, useEffect, useCallback } from "react";
import { registerClick } from "../services/api";
import { getPendingCount, startQueueListener } from "../services/clickQueue";

interface Props {
  onLogout: () => void;
}

export default function AnxietyScreen({ onLogout }: Props) {
  const [pending, setPending] = useState(0);
  const [pressed, setPressed] = useState(false);

  const refreshPending = useCallback(() => {
    setPending(getPendingCount());
  }, []);

  useEffect(() => {
    refreshPending();
    return startQueueListener(refreshPending);
  }, [refreshPending]);

  const handlePress = async () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    try {
      const res = await registerClick();
      if (res.status === 202) {
        refreshPending();
      }
    } catch {
      setPending((p) => p + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    onLogout();
  };

  return (
    <div style={styles.container}>
      <button style={styles.logoutBtn} onClick={handleLogout}>
        Salir
      </button>

      <button
        style={{
          ...styles.anxietyButton,
          ...(pressed ? styles.anxietyButtonPressed : {}),
        }}
        onClick={handlePress}
      >
        Tengo
        <br />
        ansiedad
      </button>

      {pending > 0 && (
        <p style={styles.pendingText}>Se enviará cuando haya señal</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    position: "relative",
  },
  logoutBtn: {
    position: "absolute",
    top: "24px",
    right: "24px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  anxietyButton: {
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
    lineHeight: "1.4",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 12px 40px rgba(79,70,229,0.45)",
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    transform: "scale(1)",
  },
  anxietyButtonPressed: {
    transform: "scale(0.92)",
    boxShadow: "0 6px 20px rgba(79,70,229,0.35)",
  },
  pendingText: {
    position: "absolute",
    bottom: "48px",
    color: "#f59e0b",
    fontSize: "13px",
    fontWeight: "500",
    margin: 0,
  },
};
