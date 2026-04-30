import type { Desk, Floor, Booking, CreateBookingRequest, User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface DeskScoreRequest {
  userId: number;
  deskId: number;
  startTime: string;
  endTime: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  async getFloors(): Promise<Floor[]> {
    return fetchJson<Floor[]>('/floors');
  },

  async getFloor(id: number): Promise<Floor> {
    return fetchJson<Floor>(`/floors/${id}`);
  },

  async getDesks(floorId: number): Promise<Desk[]> {
    return fetchJson<Desk[]>(`/desks?floorId=${floorId}`);
  },

  async getBookings(date?: string): Promise<Booking[]> {
    const params = date ? `?date=${date}` : '';
    return fetchJson<Booking[]>(`/bookings${params}`);
  },

  async getAllBookings(filters?: { startDate?: string; endDate?: string; floorId?: number; status?: string }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start', filters.startDate);
    if (filters?.endDate) params.append('end', filters.endDate);
    if (filters?.floorId) params.append('floorId', filters.floorId.toString());
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<Booking[]>(`/bookings${query}`);
  },

  async getBookingPrediction(date: string): Promise<number> {
    return fetchJson<number>(`/bookings/predict?day=${date}`);
  },

  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    return fetchJson<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async cancelBooking(id: number): Promise<void> {
    await fetchJson(`/bookings/${id}/cancel`, { method: 'PATCH' });
  },

  async getMyBookings(userId: number): Promise<Booking[]> {
    return fetchJson<Booking[]>(`/bookings?userId=${userId}`);
  },

  async getUsers(): Promise<User[]> {
    return fetchJson<User[]>('/users');
  },

  async getUser(id: number): Promise<User> {
    return fetchJson<User>(`/users/${id}`);
  },

  async updateDesk(id: number, isEnabled: boolean): Promise<Desk> {
    return fetchJson<Desk>(`/desks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isEnabled }),
    });
  },

  async scoreDesk(input: DeskScoreRequest): Promise<number> {
    return fetchJson<number>('/recommender', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateUser(id: number, isAdmin: boolean): Promise<User> {
    return fetchJson<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isAdmin }),
    });
  },
};
