export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ORGANIZER' | 'CHECK_IN_STAFF';
  isActive: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  venue: string;
  startDate: string;
  endDate: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  eventId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
  activeRegistrationsCount?: number;
}

export interface SessionFormData {
  title: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  capacity: number;
}

export interface Registration {
  id: string;
  sessionId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: 'reserved' | 'confirmed' | 'checked_in' | 'cancelled' | 'expired';
  reservedAt: string;
  expiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationFormData {
  attendeeName: string;
  attendeeEmail: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
