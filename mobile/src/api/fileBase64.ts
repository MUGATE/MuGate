import * as FileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  base64?: string;
};

const DOC_TYPES = Platform.select({
  ios: [
    'com.adobe.pdf',
    'org.openxmlformats.wordprocessingml.document',
    'com.microsoft.word.doc',
    'public.data',
  ],
  default: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    '*/*',
  ],
});

/** Normalize file URIs for Android (file:/ → file:///). */
export function normalizeFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('content://')) return trimmed;
  if (trimmed.startsWith('file:///')) return trimmed;
  if (trimmed.startsWith('file:/')) return trimmed.replace(/^file:\/+/, 'file:///');
  if (trimmed.startsWith('/')) return `file://${trimmed}`;
  return trimmed;
}

function safeExt(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext && /^[a-z0-9]{1,8}$/.test(ext)) return ext;
  return 'dat';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return '';
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length);
    for (let j = i; j < end; j++) {
      binary += String.fromCharCode(bytes[j]!);
    }
  }
  return btoa(binary);
}

/** RN fetch can read file:// and content:// on Android without expo path permissions. */
async function readViaFetch(uri: string): Promise<string | null> {
  const response = await fetch(uri);
  if (!response.ok) return null;
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) return null;
  return arrayBufferToBase64(buffer);
}

/** Classic RN blob read — reliable fallback for content:// URIs. */
function readViaXhr(uri: string): Promise<string | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result !== 'string' || !result.includes(',')) {
            resolve(null);
            return;
          }
          const base64 = result.split(',')[1];
          resolve(base64?.length ? base64 : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(xhr.response);
      } catch {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.onabort = () => resolve(null);
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function readViaCacheCopy(uri: string, fileName: string): Promise<string | null> {
  const ext = safeExt(fileName);
  const dest = new File(Paths.cache, `resume-upload-${Date.now()}.${ext}`);
  try {
    await new File(uri).copy(dest);
    const encoded = await dest.base64();
    return encoded?.length ? encoded : null;
  } finally {
    try {
      dest.delete();
    } catch {
      // ignore cleanup errors
    }
  }
}

async function readViaLegacyBase64(uri: string): Promise<string | null> {
  const encoded = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return encoded?.length ? encoded : null;
}

/**
 * Read binary file content as base64 without multipart upload.
 * Tries multiple strategies because Android picker URIs vary by device/provider.
 */
export async function readFileUriAsBase64(uri: string, fileName = 'resume.dat'): Promise<string> {
  const normalized = normalizeFileUri(uri);
  const errors: string[] = [];

  const attempt = async (label: string, fn: () => Promise<string | null>) => {
    try {
      const result = await fn();
      if (result?.length) return result;
      errors.push(`${label}: empty`);
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return null;
  };

  const strategies: Array<[string, () => Promise<string | null>]> = [
    ['fetch', () => readViaFetch(normalized)],
    ['xhr', () => readViaXhr(normalized)],
    ['cache-copy', () => readViaCacheCopy(normalized, fileName)],
    ['legacy', () => readViaLegacyBase64(normalized)],
    ['native', async () => {
      const encoded = await new File(normalized).base64();
      return encoded?.length ? encoded : null;
    }],
  ];

  for (const [label, fn] of strategies) {
    const result = await attempt(label, fn);
    if (result) return result;
  }

  console.warn('[readFileUriAsBase64] failed', { uri: normalized, errors });
  throw new Error('Could not read the selected file. Try picking it again.');
}

export async function pickResumeFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: DOC_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const name = asset.name || 'resume.pdf';
  const uri = normalizeFileUri(asset.uri);
  const mimeType = asset.mimeType ?? undefined;

  const webBase64 =
    typeof asset.base64 === 'string' && asset.base64.length > 0 ? asset.base64 : undefined;
  const base64 = webBase64 ?? (await readFileUriAsBase64(uri, name));

  return { uri, name, mimeType, base64 };
}
