import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const createRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    const { attendeeName, attendeeEmail } = req.body;
    const createdById = (req as any).user?.id; // Optional if public

    // Atomic capacity check and reservation
    const registration = await prisma.$transaction(async (tx: any) => {
      // 1. Lock the session row for update
      const sessionList = await tx.$queryRaw<any[]>`
        SELECT id, capacity FROM sessions WHERE id = ${sessionId}::uuid FOR UPDATE;
      `;
      if (sessionList.length === 0) {
        throw new AppError('Session not found', 404);
      }
      const session = sessionList[0];

      // 2. Count active registrations
      const activeCountList = await tx.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM registrations 
        WHERE "sessionId" = ${sessionId}::uuid AND status NOT IN ('cancelled', 'expired');
      `;
      const activeCount = activeCountList[0].count;

      if (activeCount >= session.capacity) {
        throw new AppError('Session is at full capacity', 400);
      }

      // 3. Check for existing active registration for this email
      const existing = await tx.registration.findFirst({
        where: {
          sessionId,
          attendeeEmail,
          status: { notIn: ['cancelled', 'expired'] }
        }
      });

      if (existing) {
        throw new AppError('User is already registered for this session', 409);
      }

      // 4. Create the registration
      return await tx.registration.create({
        data: {
          sessionId,
          attendeeName,
          attendeeEmail,
          status: 'reserved',
          createdById
        }
      });
    });

    res.status(201).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

export const updateRegistrationStatus = (targetStatus: 'confirmed' | 'checkedIn' | 'cancelled') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const updated = await prisma.$transaction(async (tx: any) => {
        // Lock the registration for update
        const regList = await tx.$queryRaw<any[]>`
          SELECT id, status FROM registrations WHERE id = ${id}::uuid FOR UPDATE;
        `;
        
        if (regList.length === 0) {
          throw new AppError('Registration not found', 404);
        }
        const reg = regList[0];

        // State machine validation
        if (targetStatus === 'confirmed') {
          if (reg.status !== 'reserved') {
            throw new AppError('Only reserved registrations can be confirmed', 400);
          }
        } else if (targetStatus === 'checkedIn') {
          if (reg.status !== 'confirmed' && reg.status !== 'reserved') {
            throw new AppError('Cannot check-in a cancelled or expired registration', 400);
          }
        } else if (targetStatus === 'cancelled') {
          if (reg.status === 'cancelled' || reg.status === 'expired') {
            throw new AppError('Registration is already cancelled or expired', 400);
          }
        }

        const updates: any = { status: targetStatus === 'checkedIn' ? 'checked-in' : targetStatus };
        if (targetStatus === 'confirmed') updates.confirmedAt = new Date();
        if (targetStatus === 'checkedIn') updates.checkedInAt = new Date();
        if (targetStatus === 'cancelled') updates.cancelledAt = new Date();

        return await tx.registration.update({
          where: { id },
          data: updates
        });
      });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };
};

export const confirmRegistration = updateRegistrationStatus('confirmed');
export const checkInRegistration = updateRegistrationStatus('checkedIn');
export const cancelRegistration = updateRegistrationStatus('cancelled');
