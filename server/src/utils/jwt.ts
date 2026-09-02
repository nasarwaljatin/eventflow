import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthPayload } from '../types/index.js';

export function generateAccessToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRY || '15m';
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign({ ...payload }, secret, options);
}

export function generateRefreshToken(payload: AuthPayload): string {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign({ ...payload }, secret, options);
}

export function verifyAccessToken(token: string): AuthPayload {
  const secret = process.env.JWT_SECRET || 'secret';
  return jwt.verify(token, secret) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
  return jwt.verify(token, secret) as AuthPayload;
}
