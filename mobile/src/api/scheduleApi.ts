import { apiFetch } from './client';
import { TopSchedule } from '../utils/scheduleHelpers';

export type SchedulePreferences = {
  skip8am: boolean;
  twoDaysOnly: boolean;
  freeFridays: boolean;
  maxCredits: number;
};

export type GenerateSchedulesResponse = {
  data: {
    topSchedules: TopSchedule[];
    semesterId?: number;
    offeringsFound?: number;
  };
};

export async function generateSchedules(
  preferences: SchedulePreferences
): Promise<GenerateSchedulesResponse> {
  const payload = {
    preferences: {
      excludeDays: preferences.freeFridays ? [4] : [],
      startTime: preferences.skip8am ? '9:00:00' : null,
      maxCredits: preferences.maxCredits,
      twoDaysOnly: preferences.twoDaysOnly,
    },
  };

  const controller = new AbortController();
  const timeoutMs = 180_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await apiFetch<GenerateSchedulesResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
      throw new Error(
        'Schedule generation timed out. The server may still be syncing with the portal — try again in a moment.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function getSavedSchedules() {
  return apiFetch<{ data: { courses?: unknown[] }[] }>('/schedules');
}

export async function saveSchedule(payload: {
  name: string;
  score: number;
  totalCredits: number;
  sectionIds: number[];
}) {
  return apiFetch<{ success: boolean }>('/schedules/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
