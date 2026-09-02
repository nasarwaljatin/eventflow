import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/index.js';

export function successResponse(res: Response, data?: any, statusCode: number = 200): void {
  const payload: ApiResponse = { success: true };
  if (data !== undefined) payload.data = data;
  res.status(statusCode).json(payload);
}

export function errorResponse(res: Response, message: string, statusCode: number = 400): void {
  res.status(statusCode).json({ success: false, error: message });
}

export function paginatedResponse(res: Response, data: any, meta: PaginationMeta): void {
  res.status(200).json({ success: true, data, meta });
}
