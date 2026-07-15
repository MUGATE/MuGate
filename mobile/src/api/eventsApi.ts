import { apiFetch } from './client';

export type EventItem = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  /** @deprecated Prefer startDate — kept for older callers */
  eventDate?: string;
  source?: string;
  imageUrl?: string;
};

export async function getUpcomingEvents(filters: {
  search?: string;
  category?: string;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.limit) params.append('limit', String(filters.limit));
  const qs = params.toString();
  const data = await apiFetch<{ data: EventItem[] }>(
    `/events${qs ? `?${qs}` : ''}`
  );
  return data.data ?? [];
}

export async function getEventCategories() {
  const data = await apiFetch<{ data: string[] }>('/events/categories');
  return data.data ?? [];
}
