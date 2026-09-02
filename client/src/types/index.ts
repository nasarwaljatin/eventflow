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

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
