import api from './axios';
import { Alert, AlertCount, ApiResponse } from '../types';

export const getAlerts = async (): Promise<Alert[]> => {
  const response = await api.get<ApiResponse<Alert[]>>('/alerts');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch alerts');
  }
  return response.data.data;
};

export const getAlertCount = async (): Promise<AlertCount> => {
  const response = await api.get<ApiResponse<AlertCount>>('/alerts/count');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch alert count');
  }
  return response.data.data;
};

export const dismissAlert = async (id: string): Promise<Alert> => {
  const response = await api.patch<ApiResponse<Alert>>(`/alerts/${id}/dismiss`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to dismiss alert');
  }
  return response.data.data;
};
