import api from './axios';
import { User, AuthResponse } from '../types';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
};

export const register = async (email: string, password: string, fullName: string, role: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/register', { email, password, fullName, role });
  return data.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const googleLogin = async (credential: string, role?: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/google', { credential, role });
  return data.data;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const { data } = await api.post('/auth/refresh');
  return data.data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const { data } = await api.get('/auth/me');
  // Backend returns { success: true, data: { id, email, role, fullName } }
  // We wrap it so AuthContext can do data.user
  return { user: data.data };
};
