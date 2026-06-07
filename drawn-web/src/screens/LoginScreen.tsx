import React, { useState } from "react";
import { login, register } from "../services/api";

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (!isLogin && password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } =
        mode === "login"
          ? await login(username.trim(), password)
          : await register(username.trim(), password);
      localStorage.setItem("jwt_token", data.access_token);
      onLogin();
    } catch (err: any) {
      const msg = err?.response?.data?.message?.[0] ?? err?.response?.data?.message;
      setError(msg ?? (isLogin ? "Usuario o contraseña incorrectos" : "No se pudo crear la cuenta"));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
    setConfirm("");
  };

  const isLogin = mode === "login";
  const isValid = isLogin
    ? !!username && !!password
    : !!username && password.length >= 8 && password === confirm;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>MindShift</h1>
      <p style={styles.subtitle}>
        {isLogin ? "Ingresa para continuar" : "Crea tu cuenta"}
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
        />
        <input
          style={styles.input}
          type="password"
          placeholder={isLogin ? "Contraseña" : "Contraseña (mín. 8 caracteres)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
        {!isLogin && (
          <input
            style={styles.input}
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        )}
        {error && <p style={styles.error}>{error}</p>}
        <button
          style={{
            ...styles.button,
            ...(!isValid ? styles.buttonDisabled : {}),
          }}
          type="submit"
          disabled={loading || !isValid}
        >
          {loading ? "..." : isLogin ? "Ingresar" : "Registrarse"}
        </button>
      </form>

      <button style={styles.toggleBtn} onClick={toggleMode}>
        {isLogin
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Ingresa"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#1a1a2e",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#888",
    margin: "0 0 48px",
  },
  form: {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    width: "100%",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "16px",
    color: "#1a1a2e",
    backgroundColor: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
  },
  button: {
    width: "100%",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  buttonDisabled: {
    backgroundColor: "#c7c5f4",
    cursor: "not-allowed",
  },
  error: {
    color: "#ef4444",
    fontSize: "14px",
    margin: "0",
    textAlign: "center",
  },
  toggleBtn: {
    marginTop: "24px",
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontSize: "14px",
    cursor: "pointer",
  },
};
