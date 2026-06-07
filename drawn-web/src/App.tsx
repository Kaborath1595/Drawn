import { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import AnxietyScreen from './screens/AnxietyScreen';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem('jwt_token'));
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!token) {
    return (
      <LoginScreen
        onLogin={() => setToken(localStorage.getItem('jwt_token'))}
      />
    );
  }

  return <AnxietyScreen onLogout={() => setToken(null)} />;
}
