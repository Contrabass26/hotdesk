export interface Desk {
  id: number;
  floorId: number;
  label: string;
  xCoord: number;
  yCoord: number;
  isEnabled: boolean;
}

export interface Floor {
  id: number;
  name: string;
  desks: Desk[];
}

export interface Booking {
  id: number;
  userId: number;
  deskId: number;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'no_show';
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  teamId: number | null;
}

export interface CreateBookingRequest {
  deskId: number;
  startTime: string;
  endTime: string;
}
