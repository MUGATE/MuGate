import { apiFetch } from './client';

export async function getAdmins() {
  const data = await apiFetch<{ admins: unknown[] }>('/auth/admins');
  return data.admins ?? [];
}

export async function addAdmin(universityId: string) {
  return apiFetch('/auth/admins', {
    method: 'POST',
    body: JSON.stringify({ universityId }),
  });
}

export async function removeAdmin(universityId: string) {
  return apiFetch(`/auth/admins/${universityId}`, { method: 'DELETE' });
}
