import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { register } from "../services/api";
import { setToken } from "../services/storage";

interface Props {
  onRegister: () => void;
  onGoToLogin: () => void;
}

export default function RegisterScreen({ onRegister, onGoToLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password) return;
    if (password !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const { data } = await register(username.trim(), password);
      await setToken(data.access_token);
      onRegister();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message?.[0] ??
        e?.response?.data?.message ??
        "No se pudo crear la cuenta";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const valid = username.trim().length > 0 && password.length >= 8 && password === confirm;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>MindShift</Text>
      <Text style={styles.subtitle}>Crear cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 8 caracteres)"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#aaa"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, !valid && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading || !valid}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={onGoToLogin}>
        <Text style={styles.linkText}>¿Ya tenés cuenta? Iniciá sesión</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    marginBottom: 48,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
    color: "#1a1a2e",
    backgroundColor: "#fafafa",
  },
  button: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#c7c5f4",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    marginTop: 24,
  },
  linkText: {
    color: "#4f46e5",
    fontSize: 14,
  },
});
