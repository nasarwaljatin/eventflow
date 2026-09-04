export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN';
  authProvider?: string;
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
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: { id: string; fullName: string; email: string };
  createdBy: string | { id: string; fullName: string; email: string };
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

export interface RegistrationFilters {
  search?: string;
  event?: string;
  session?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportResult {
  row: number;
  status: 'created' | 'duplicate' | 'rejected';
  reason?: string;
  name?: string;
  email?: string;
}

export interface ImportResponse {
  summary: {
    total: number;
    created: number;
    duplicates: number;
    rejected: number;
  };
  rows: ImportResult[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardMetrics {
  headlines: {
    sessionsToday: number;
    checkedInToday: number;
    expiredThisWeek: number;
    sessionsAtCapacity: number;
  };
  statusBreakdown: {
    status: string;
    count: number;
  }[];
  registrationsBySession: {
    sessionId: string;
    title: string;
    count: number;
    capacity: number;
  }[];
  checkinsPerDay: {
    date: string;
    count: number;
  }[];
}

export interface TimelineEntry {
  id: string;
  registrationId: string;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
  performedByUserId?: string | null;
  performedAt: string;
  performedBy?: {
    id: string;
    fullName: string;
  } | null;
}

export interface Alert {
  id: string;
  sessionId: string;
  isDismissed: boolean;
  dismissedBy?: string | null;
  dismissedAt?: string | null;
  triggeredAt: string;
  session?: {
    id: string;
    title: string;
    eventId: string;
    event?: {
      id: string;
      name: string;
    };
    activeRegistrationsCount?: number;
    capacity?: number;
  };
}

export interface AlertCount {
  count: number;
}

export interface AdminStats {
  events: {
    pending: number;
    approved: number;
    rejected: number;
  };
  totalUsers: number;
  totalRegistrations: number;
  usersByRole: { role: string; count: number }[];
}
