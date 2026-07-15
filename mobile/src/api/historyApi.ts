import { apiFetch } from './client';

export type AcademicSummary = {
  gpa: number | null;
  gpaUpdatedAt: string | null;
};

export async function getAcademicSummary(): Promise<AcademicSummary> {
  const data = await apiFetch<{ success: boolean; data: AcademicSummary }>(
    '/history/summary'
  );
  return data.data;
}

export async function syncHistory(): Promise<AcademicSummary | null> {
  const data = await apiFetch<{
    success: boolean;
    summary?: AcademicSummary;
  }>('/history/sync', { method: 'POST' });
  return data.summary ?? null;
}
