import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem('jwt_token');
  return SecureStore.getItemAsync('jwt_token');
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem('jwt_token', token); return; }
  await SecureStore.setItemAsync('jwt_token', token);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') { localStorage.removeItem('jwt_token'); return; }
  await SecureStore.deleteItemAsync('jwt_token');
}
