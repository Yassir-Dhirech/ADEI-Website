import type { ApiResponse } from '@/types/api';

// En dev : 'http://localhost:5001' | En prod Vercel (rewrite) : '' (relatif)
export const API_BASE = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? 'http://localhost:5001' : '');

  
export function getImageUrl(path?: string | null): string {
  if (!path) return '/images/default.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`;
  return path.startsWith('/') ? path : `/${path}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = isFormData
    ? { ...(options.headers || {}) }
    : { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    credentials: 'include', // Envoie le cookie httpOnly automatiquement
    headers
  });

  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) {
    throw new Error(payload.error?.message || payload.message || 'Erreur API');
  }
  return payload;
}