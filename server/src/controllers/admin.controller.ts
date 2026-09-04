import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pendingCount, approvedCount, rejectedCount, totalUsers, totalRegistrations] = await Promise.all([
      prisma.event.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.event.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.event.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.user.count(),
      prisma.registration.count(),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    successResponse(res, {
      events: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
      totalUsers,
      totalRegistrations,
      usersByRole: usersByRole.map(u => ({ role: u.role, count: u._count })),
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '25' } = req.query;

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
      where.approvalStatus = status;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          approvedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, events);
  } catch (err) {
    next(err);
  }
};

export const approveEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.approvalStatus !== 'PENDING') {
      throw new AppError(`Event is already ${event.approvalStatus.toLowerCase()}`, 400);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: user.userId,
        approvedAt: new Date(),
      },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    successResponse(res, updated);
  } catch (err) {
    next(err);
  }
};

export const rejectEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user!;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.approvalStatus !== 'PENDING') {
      throw new AppError(`Event is already ${event.approvalStatus.toLowerCase()}`, 400);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason || null,
        approvedById: user.userId,
        approvedAt: new Date(),
      },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    successResponse(res, updated);
  } catch (err) {
    next(err);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        authProvider: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, users);
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ORGANIZER', 'CHECK_IN_STAFF', 'ADMIN'].includes(role)) {
      throw new AppError('Invalid role specified', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        authProvider: true,
        isActive: true,
        createdAt: true,
      },
    });

    successResponse(res, updatedUser);
  } catch (err) {
    next(err);
  }
};
