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
  image: string;
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

export interface Team {
  id: number;
  name: string;
  departmentId: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface CreateBookingRequest {
  userId: number;
  deskId: number;
  startTime: string;
  endTime: string;
}
