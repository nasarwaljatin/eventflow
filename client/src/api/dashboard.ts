import api from './axios';
import { DashboardMetrics, ApiResponse } from '../types';

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await api.get<ApiResponse<DashboardMetrics>>('/dashboard');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch dashboard metrics');
  }
  return response.data.data;
};
