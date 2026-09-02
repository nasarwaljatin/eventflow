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
