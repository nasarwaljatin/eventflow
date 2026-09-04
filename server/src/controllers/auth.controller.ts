import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { OAuth2Client } from 'google-auth-library';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already in use', 400);
    
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName, role, authProvider: 'local' }
    });
    
    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt }
    });
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    
    successResponse(res, { user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName }, accessToken }, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);
    if (user.authProvider === 'google' && !user.passwordHash) throw new AppError('This account uses Google Sign-In. Please sign in with Google.', 400);
    
    if (!user.passwordHash) throw new AppError('Invalid credentials', 401);
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) throw new AppError('Invalid credentials', 401);
    
    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt }
    });
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    
    successResponse(res, { user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName }, accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie('refreshToken');
    successResponse(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new AppError('No refresh token provided', 401);
    
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
    
    const tokenDb = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!tokenDb) throw new AppError('Invalid refresh token', 401);
    
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);
    
    const newPayload = { userId: user.id, role: user.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt } })
    ]);
    
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    successResponse(res, { accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) throw new AppError('User not found', 404);
    
    successResponse(res, { id: user.id, email: user.email, role: user.role, fullName: user.fullName });
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, role } = req.body;
    
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      throw new AppError('Invalid Google token', 400);
    }
    
    const { email, name, sub: googleId } = googlePayload;
    
    // Try to find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });
    
    if (user) {
      // Link Google account if user exists with local auth but no googleId
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: user.authProvider === 'local' ? 'local' : 'google' }
        });
      }
      if (!user.isActive) throw new AppError('Account is deactivated', 401);
    } else {
      // Create new user with Google auth, assigning specified role or defaulting to CHECK_IN_STAFF
      const assignedRole = (role === 'ORGANIZER' || role === 'CHECK_IN_STAFF') ? role : 'CHECK_IN_STAFF';
      user = await prisma.user.create({
        data: {
          email: email!,
          fullName: name || email!,
          role: assignedRole,
          authProvider: 'google',
          googleId,
          passwordHash: null,
        }
      });
    }
    
    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt }
    });
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    
    successResponse(res, { user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName }, accessToken });
  } catch (err) {
    next(err);
  }
};
