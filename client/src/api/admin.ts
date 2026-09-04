import api from './axios';
import { Event, AdminStats, ApiResponse, PaginatedResponse } from '../types';

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<ApiResponse<AdminStats>>('/admin/stats');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch admin stats');
  }
  return response.data.data;
};

export const getAdminEvents = async (status?: string): Promise<PaginatedResponse<Event>> => {
  const params = status ? { status } : {};
  const { data } = await api.get('/admin/events', { params });
  return data;
};

export const getPendingEvents = async (): Promise<Event[]> => {
  const response = await api.get<ApiResponse<Event[]>>('/admin/events/pending');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch pending events');
  }
  return response.data.data;
};

export const approveEvent = async (id: string): Promise<Event> => {
  const response = await api.patch<ApiResponse<Event>>(`/admin/events/${id}/approve`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to approve event');
  }
  return response.data.data;
};

export const rejectEvent = async (id: string, reason?: string): Promise<Event> => {
  const response = await api.patch<ApiResponse<Event>>(`/admin/events/${id}/reject`, { reason });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to reject event');
  }
  return response.data.data;
};

export const getAdminUsers = async (): Promise<import('../types').User[]> => {
  const response = await api.get<ApiResponse<import('../types').User[]>>('/admin/users');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch users');
  }
  return response.data.data;
};

export const updateUserRole = async (userId: string, role: string): Promise<import('../types').User> => {
  const response = await api.patch<ApiResponse<import('../types').User>>(`/admin/users/${userId}/role`, { role });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update user role');
  }
  return response.data.data;
};
