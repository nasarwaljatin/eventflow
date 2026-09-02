import api from './axios';
import { User } from '../types';

export const getUsersByRole = async (role: string): Promise<User[]> => {
  const { data } = await api.get(`/users?role=${role}`);
  return data.data;
};
