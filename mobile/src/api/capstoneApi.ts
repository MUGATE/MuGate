import { apiFetch } from './client';

export async function getPartners(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await apiFetch<{ partners: unknown[] }>(`/capstone/partners${query}`);
  return data.partners ?? [];
}

export type AddPartnerPayload = {
  email: string;
  phone?: string;
  major: string;
  skills?: string;
  description: string;
  lookingFor?: string;
  userName?: string;
};

export async function addPartner(partnerData: AddPartnerPayload) {
  return apiFetch<{ success: boolean; partner: unknown }>('/capstone/partners', {
    method: 'POST',
    body: JSON.stringify(partnerData),
  });
}

export async function deletePartner(partnerId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/capstone/partners/${partnerId}`, {
    method: 'DELETE',
  });
}

export async function getIdeas(search = '', faculty = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (faculty) params.set('faculty', faculty);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiFetch<{ ideas: unknown[] }>(`/capstone/ideas${query}`);
  return data.ideas ?? [];
}

export async function chatWithAI(
  message: string,
  history: Array<{ role: string; content: string }> = []
) {
  return apiFetch<{ success: boolean; text: string; ideasUsed?: number }>('/capstone/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}
