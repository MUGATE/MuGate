import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'mugate_token';
export const USER_KEY = 'mugate_user';
export const ANON_SESSIONS_KEY = 'mugate_anon_sessions';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getUser<T = Record<string, unknown>>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setUser(user: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getAnonSessionIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(ANON_SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function storeAnonSessionId(sessionId: string): Promise<void> {
  const ids = await getAnonSessionIds();
  if (!ids.includes(sessionId)) {
    ids.unshift(sessionId);
    if (ids.length > 20) ids.length = 20;
    await AsyncStorage.setItem(ANON_SESSIONS_KEY, JSON.stringify(ids));
  }
}

export async function removeAnonSessionId(sessionId: string): Promise<void> {
  const ids = (await getAnonSessionIds()).filter((id) => id !== sessionId);
  await AsyncStorage.setItem(ANON_SESSIONS_KEY, JSON.stringify(ids));
}
