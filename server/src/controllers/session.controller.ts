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
