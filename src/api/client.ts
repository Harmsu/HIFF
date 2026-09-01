import type { Festival, Theater, FestivalEventWithTheater, EventType } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  Object.assign(headers, options.headers || {});

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    if (token) localStorage.removeItem('token');
    throw new Error(data.error || 'Ei kirjautunut');
  }

  if (!res.ok) throw new Error(data.error || 'Pyyntö epäonnistui');
  return data as T;
}

export interface EventInput {
  festivalId: string;
  type: EventType;
  date: string;
  name: string;
  link: string;
  theaterId: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  highlight: string;
  note: string;
}

export interface ImportEventRow {
  festivalName: string;
  festivalYear: number;
  type: EventType;
  date: string;
  name: string;
  link?: string;
  theaterName?: string;
  theaterLocation?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number | null;
  highlight?: string;
  note?: string;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ username: string; email: string }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Festivals
  getFestivals: () => request<Festival[]>('/festivals'),
  createFestival: (festival: Omit<Festival, 'id'>) =>
    request<Festival>('/festivals', { method: 'POST', body: JSON.stringify(festival) }),
  updateFestival: (id: string, festival: Omit<Festival, 'id'>) =>
    request<Festival>(`/festivals/${id}`, { method: 'PUT', body: JSON.stringify(festival) }),
  deleteFestival: (id: string) => request<{ success: boolean }>(`/festivals/${id}`, { method: 'DELETE' }),

  // Theaters
  getTheaters: () => request<Theater[]>('/theaters'),
  createTheater: (theater: Omit<Theater, 'id'>) =>
    request<Theater>('/theaters', { method: 'POST', body: JSON.stringify(theater) }),
  updateTheater: (id: string, theater: Omit<Theater, 'id'>) =>
    request<Theater>(`/theaters/${id}`, { method: 'PUT', body: JSON.stringify(theater) }),
  deleteTheater: (id: string) => request<{ success: boolean }>(`/theaters/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: (festivalId: string) =>
    request<FestivalEventWithTheater[]>(`/events?festivalId=${encodeURIComponent(festivalId)}`),
  createEvent: (event: EventInput) =>
    request<FestivalEventWithTheater>('/events', { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (id: string, event: EventInput) =>
    request<FestivalEventWithTheater>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
  deleteEvent: (id: string) => request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' }),
  sendInvite: (id: string, email: string) =>
    request<{ success: boolean }>(`/events/${id}/invite`, { method: 'POST', body: JSON.stringify({ email }) }),
  importEvents: (events: ImportEventRow[]) =>
    request<{ imported: number }>('/events/import', { method: 'POST', body: JSON.stringify({ events }) }),
  exportEventsUrl: (festivalId: string) =>
    `${BASE_URL}/events/export?festivalId=${encodeURIComponent(festivalId)}`,
};

export { getToken };
