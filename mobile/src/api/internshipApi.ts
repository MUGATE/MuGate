import { apiFetch } from './client';

export type Company = {
  id: number;
  name: string;
  description?: string;
  svgString?: string;
  website?: string;
  email?: string;
  phone?: string;
};

export type Review = {
  id: number;
  companyId: number;
  rating: number;
  feedback: string;
  authorName?: string;
  createdAt?: string;
};

export async function getCompanies() {
  const data = await apiFetch<{ companies: Company[] }>('/internships/companies');
  return data.companies ?? [];
}

export async function getCompanyStats() {
  const data = await apiFetch<{
    stats: { companyId: number; avgRating: number; reviewCount: number }[];
  }>('/internships/stats');
  return data.stats ?? [];
}

export async function getCompanyReviews(companyId: number) {
  const data = await apiFetch<{ reviews: Review[] }>(
    `/internships/reviews/${companyId}`
  );
  return data.reviews ?? [];
}

export async function submitReview(companyId: number, rating: number, feedback: string) {
  return apiFetch(`/internships/reviews/${companyId}`, {
    method: 'POST',
    body: JSON.stringify({ rating, feedback }),
  });
}
