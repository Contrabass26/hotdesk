import type { Desk, Floor, Booking, CreateBookingRequest } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
    return fetchJson<Desk[]>(`/floors/${floorId}/desks`);
  },

  async getBookings(date?: string): Promise<Booking[]> {
    const params = date ? `?date=${date}` : '';
    return fetchJson<Booking[]>(`/bookings${params}`);
  },

  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    return fetchJson<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async cancelBooking(id: number): Promise<void> {
    await fetchJson(`/bookings/${id}`, { method: 'DELETE' });
  },

  async getMyBookings(): Promise<Booking[]> {
    return fetchJson<Booking[]>('/bookings/me');
  },
};
