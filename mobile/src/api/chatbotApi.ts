import { apiFetch } from './client';
import {
  getToken,
  removeAnonSessionId,
  storeAnonSessionId,
} from './storage';

export type ChatSession = {
  id: string;
  title?: string;
  source?: string;
  isPinned?: boolean;
  updatedAt?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
};

export async function createSession(
  title: string,
  source = 'chat'
): Promise<ChatSession> {
  const data = await apiFetch<{ session: ChatSession }>('/chatbot/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, source }),
  });
  const session = data.session;
  const token = await getToken();
  if (source === 'chat' && !token) {
    await storeAnonSessionId(session.id);
  }
  return session;
}

export async function getSessions(): Promise<ChatSession[]> {
  const token = await getToken();
  if (!token) return [];
  const data = await apiFetch<{ sessions: ChatSession[] }>('/chatbot/sessions');
  return data.sessions ?? [];
}

export async function sendMessage(
  sessionId: string,
  content: string,
  reasoning = false
) {
  return apiFetch<{ success: boolean; text: string; tokensUsed?: number }>(
    '/chatbot/message',
    {
      method: 'POST',
      body: JSON.stringify({ sessionId, content, reasoning }),
    }
  );
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const data = await apiFetch<{ success: boolean; messages: ChatMessage[] }>(
    `/chatbot/sessions/${sessionId}/messages`
  );
  return data.messages ?? [];
}

export async function deleteSession(sessionId: string) {
  const data = await apiFetch(`/chatbot/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  await removeAnonSessionId(sessionId);
  return data;
}

export async function enhancePrompt(prompt: string) {
  return apiFetch<{ success: boolean; enhancedPrompt: string }>(
    '/chatbot/enhance-prompt',
    {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }
  );
}
