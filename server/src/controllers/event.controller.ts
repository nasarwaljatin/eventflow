import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    
    const event = await prisma.event.create({
      data: {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        createdById: req.user.userId
      }
    });
    
    successResponse(res, event, 201);
  } catch (err) {
    next(err);
  }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    
    const events = await prisma.event.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      orderBy: { startDate: 'asc' }
    });
    
    successResponse(res, events);
  } catch (err) {
    next(err);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new AppError('Event not found', 404);
    
    successResponse(res, event);
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = req.params.id;
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) throw new AppError('Event not found', 404);
    
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });
    
    successResponse(res, updated);
  } catch (err) {
    next(err);
  }
};

export const toggleArchive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = req.params.id;
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) throw new AppError('Event not found', 404);
    
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { isArchived: !existing.isArchived }
    });
    
    successResponse(res, updated);
  } catch (err) {
    next(err);
  }
};
