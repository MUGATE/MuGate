import { apiFetch } from './client';

export type RoadmapCourse = {
  id?: number;
  courseCode: string;
  courseName: string;
  credits: number;
  category: string;
  year: number;
  semester: string;
};

export async function getRoadmap() {
  return apiFetch<{ success: boolean; data: RoadmapCourse[]; isGuest?: boolean }>('/roadmap');
}

export async function saveRoadmap(courses: RoadmapCourse[]) {
  return apiFetch('/roadmap', {
    method: 'POST',
    body: JSON.stringify({ courses }),
  });
}

export async function resetRoadmap() {
  return apiFetch<{ success: boolean; data: RoadmapCourse[] }>('/roadmap/reset', {
    method: 'POST',
  });
}
