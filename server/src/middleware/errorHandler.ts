import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse.js';

export class AppError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }
  
  return errorResponse(res, 'Internal Server Error', 500);
};
