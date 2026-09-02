import api from './axios';
import { Registration, RegistrationFormData } from '../types';

export const getRegistrations = async (sessionId: string): Promise<Registration[]> => {
  const { data } = await api.get(`/sessions/${sessionId}/registrations`);
  return data.data;
};

export const createRegistration = async (sessionId: string, registrationData: RegistrationFormData): Promise<Registration> => {
  const { data } = await api.post(`/sessions/${sessionId}/registrations`, registrationData);
  return data.data;
};

export const confirmRegistration = async (id: string): Promise<Registration> => {
  const { data } = await api.patch(`/registrations/${id}/confirm`);
  return data.data;
};

export const checkInRegistration = async (id: string): Promise<Registration> => {
  const { data } = await api.patch(`/registrations/${id}/check-in`);
  return data.data;
};

export const cancelRegistration = async (id: string): Promise<Registration> => {
  const { data } = await api.patch(`/registrations/${id}/cancel`);
  return data.data;
};

export const getAllRegistrations = async (filters: import('../types').RegistrationFilters): Promise<import('../types').PaginatedResponse<Registration>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  const { data } = await api.get(`/registrations?${params.toString()}`);
  return data; // Return full response with data and meta
};
