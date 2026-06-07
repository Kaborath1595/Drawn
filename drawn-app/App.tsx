import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnxietyScreen from './src/screens/AnxietyScreen';
import { getToken } from './src/services/storage';

type Screen = 'login' | 'register' | 'app';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToken().then((t) => {
      if (t) setScreen('app');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      {screen === 'login' && (
        <LoginScreen
          onLogin={() => setScreen('app')}
          onGoToRegister={() => setScreen('register')}
        />
      )}
      {screen === 'register' && (
        <RegisterScreen
          onRegister={() => setScreen('app')}
          onGoToLogin={() => setScreen('login')}
        />
      )}
      {screen === 'app' && (
        <AnxietyScreen onLogout={() => setScreen('login')} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
