import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const { title, startTime, durationMin, location, capacity } = req.body;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    const start = new Date(startTime);
    if (start < event.startDate || start > event.endDate) {
      throw new AppError('Session start time must be within event dates', 400);
    }

    const session = await prisma.session.create({
      data: {
        eventId,
        title,
        startTime: start,
        durationMin,
        location,
        capacity,
      },
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionsByEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    const sessions = await prisma.session.findMany({
      where: { eventId },
      orderBy: { startTime: 'asc' }
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id }
    });
    
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, startTime, durationMin, location, capacity } = req.body;
    
    const session = await prisma.session.findUnique({
      where: { id },
      include: { event: true }
    });
    
    if (!session) {
      throw new AppError('Session not found', 404);
    }
    
    let start = session.startTime;
    if (startTime) {
      start = new Date(startTime);
      if (start < session.event.startDate || start > session.event.endDate) {
        throw new AppError('Session start time must be within event dates', 400);
      }
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        title,
        startTime: start,
        durationMin,
        location,
        capacity,
      },
    });

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id }
    });
    
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await prisma.session.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: 'Session deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

export const assignStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    const { userId } = req.body;
    
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError('Session not found', 404);
    }
    
    const staffUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!staffUser || staffUser.role !== 'CHECK_IN_STAFF') {
      throw new AppError('User is not check-in staff', 400);
    }
    
    const existing = await prisma.sessionStaff.findUnique({
      where: { sessionId_userId: { sessionId, userId } }
    });
    
    if (existing) {
      return res.status(409).json({ success: false, error: 'Staff already assigned to this session' });
    }

    const assignment = await prisma.sessionStaff.create({
      data: {
        sessionId,
        userId,
        assignedById: req.user.userId
      }
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const removeStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId, userId } = req.params;
    
    const existing = await prisma.sessionStaff.findUnique({
      where: { sessionId_userId: { sessionId, userId } }
    });
    
    if (!existing) {
      throw new AppError('Staff assignment not found', 404);
    }

    await prisma.sessionStaff.delete({
      where: { sessionId_userId: { sessionId, userId } }
    });

    res.json({ success: true, data: { message: 'Staff removed successfully' } });
  } catch (error) {
    next(error);
  }
};

export const listStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    
    const staff = await prisma.sessionStaff.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, fullName: true, email: true } } }
    });

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

