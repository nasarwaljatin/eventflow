import api from './axios';
import { Event } from '../types';

export const getEvents = async (includeArchived?: boolean):Promise<Event[]> => {
  const { data } = await api.get('/events', { params: { includeArchived } });
  return data.data;
};

export const getEventById = async (id: string):Promise<Event> => {
  const { data } = await api.get(`/events/${id}`);
  return data.data;
};

export const createEvent = async (eventData: Partial<Event>):Promise<Event> => {
  const { data } = await api.post('/events', eventData);
  return data.data;
};

export const updateEvent = async (id: string, eventData: Partial<Event>):Promise<Event> => {
  const { data } = await api.patch(`/events/${id}`, eventData);
  return data.data;
};

export const toggleArchive = async (id: string, isArchived: boolean):Promise<Event> => {
  const { data } = await api.patch(`/events/${id}/archive`, { isArchived });
  return data.data;
};
