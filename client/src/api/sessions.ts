import api from './axios';
import { Session, SessionFormData } from '../types';

export const getSessionsByEvent = async (eventId: string): Promise<Session[]> => {
  const { data } = await api.get(`/events/${eventId}/sessions`);
  return data.data;
};

export const getSessionById = async (eventId: string, sessionId: string): Promise<Session> => {
  const { data } = await api.get(`/events/${eventId}/sessions/${sessionId}`);
  return data.data;
};

export const createSession = async (eventId: string, sessionData: SessionFormData): Promise<Session> => {
  const { data } = await api.post(`/events/${eventId}/sessions`, sessionData);
  return data.data;
};

export const updateSession = async (eventId: string, sessionId: string, sessionData: SessionFormData): Promise<Session> => {
  const { data } = await api.put(`/events/${eventId}/sessions/${sessionId}`, sessionData);
  return data.data;
};

export const deleteSession = async (eventId: string, sessionId: string): Promise<void> => {
  await api.delete(`/events/${eventId}/sessions/${sessionId}`);
};

export const getSessionStaff = async (sessionId: string): Promise<import('../types').User[]> => {
  const { data } = await api.get(`/sessions/${sessionId}/staff`);
  return data.data;
};

export const assignStaff = async (sessionId: string, userId: string): Promise<void> => {
  await api.post(`/sessions/${sessionId}/staff`, { userId });
};

export const removeStaff = async (sessionId: string, userId: string): Promise<void> => {
  await api.delete(`/sessions/${sessionId}/staff/${userId}`);
};

export const getMySessions = async (): Promise<Session[]> => {
  const { data } = await api.get('/me/sessions');
  return data.data;
};

export const importRegistrations = async (sessionId: string, file: File): Promise<import('../types').ImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/sessions/${sessionId}/registrations/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.data;
};

export const downloadCheckInSheet = async (sessionId: string, sessionTitle: string): Promise<void> => {
  const response = await api.get(`/sessions/${sessionId}/registrations/export`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `checkin-sheet-${sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
