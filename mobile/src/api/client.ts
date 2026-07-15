import Constants from 'expo-constants';
import { clearToken, clearUser, getToken } from './storage';

const API_PORT = 5000;

/**
 * Resolve the backend base URL.
 * In dev, the phone can only reach the PC at the SAME host Expo served the app
 * from (Metro's hostUri). Hardcoding a single LAN IP breaks when the PC has
 * multiple network adapters, so we derive the host from Expo at runtime and
 * fall back to the env var / localhost.
 */
function normalizeBase(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveApiBases(): string[] {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return [normalizeBase(explicit)];

  const constantsAny = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };

  const hostUri =
    constantsAny.expoConfig?.hostUri ??
    constantsAny.expoGoConfig?.debuggerHost ??
    constantsAny.manifest?.debuggerHost ??
    constantsAny.manifest2?.extra?.expoGo?.debuggerHost;

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
  const candidates = [
    host ? `http://${host}:${API_PORT}/api` : '',
    `http://10.0.2.2:${API_PORT}/api`,
    `http://localhost:${API_PORT}/api`,
  ]
    .filter(Boolean)
    .map(normalizeBase);

  return Array.from(new Set(candidates));
}

export const API_BASE_CANDIDATES = resolveApiBases();
export const API_BASE_URL = API_BASE_CANDIDATES[0] ?? `http://localhost:${API_PORT}/api`;

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function apiFetch<T = Record<string, unknown>>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const token = await getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isAbsolute = endpoint.startsWith('http');
  const candidateUrls = isAbsolute
    ? [endpoint]
    : API_BASE_CANDIDATES.map((base) => `${base}${endpoint}`);

  let response: Response | null = null;
  for (const url of candidateUrls) {
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
      break;
    } catch {}
  }

  if (!response) {
    const bases = isAbsolute ? endpoint : API_BASE_CANDIDATES.join(', ');
    throw new Error(
      `Cannot reach the server (${bases}). Make sure the backend is running and your phone is on the same Wi-Fi.`
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (
      (response.status === 401 || response.status === 403) &&
      !options.skipAuthRedirect
    ) {
      await clearToken();
      await clearUser();
      onUnauthorized?.();
    }
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string }).message)
        : `API request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
