import { apiFetch } from './client';

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  universityId: string;
  isAdmin: boolean;
  gpa?: number | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export async function login(
  universityId: string,
  password: string
): Promise<LoginResponse> {
  const data = await apiFetch<{
    success: boolean;
    data: LoginResponse;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ universityId, password }),
    skipAuthRedirect: true,
  });
  return data.data;
}

export async function checkIsAdmin(): Promise<boolean> {
  const data = await apiFetch<{ isAdmin: boolean }>('/auth/me/is-admin');
  return data.isAdmin === true;
}
