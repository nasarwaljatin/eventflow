import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { checkAndTriggerAlert } from '../lib/alerts.js';

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

export const findRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, event, session, status, sort, order = 'desc', page = '1', limit = '25' } = req.query;
    const user = req.user!;
    
    const where: any = {};

    if (search) {
      where.OR = [
        { attendeeName: { contains: search as string, mode: 'insensitive' } },
        { attendeeEmail: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (session) where.sessionId = session;
    if (event) where.session = { eventId: event };

    if (user.role === 'CHECK_IN_STAFF') {
      const assigned = await prisma.sessionStaff.findMany({
        where: { userId: user.userId },
        select: { sessionId: true }
      });
      const assignedIds = assigned.map((a: any) => a.sessionId);
      
      if (where.sessionId) {
        if (!assignedIds.includes(where.sessionId as string)) {
           return res.json({ success: true, data: [], meta: { page: 1, limit: 1, total: 0, totalPages: 0 } });
        }
      } else {
        where.sessionId = { in: assignedIds };
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let orderBy: any = {};
    if (sort) {
      // Handle mapping from camelCase/snake_case
      const sortField = sort === 'reserved_at' ? 'reservedAt' : 
                        sort === 'attendee_name' ? 'attendeeName' : sort;
      orderBy[sortField as string] = order;
    } else {
       orderBy.reservedAt = order;
    }

    const [data, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: { session: { include: { event: true } } },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.registration.count({ where })
    ]);

    res.json({
      success: true,
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportRegistrationsCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    
    const registrations = await prisma.registration.findMany({
      where: { sessionId },
      orderBy: { attendeeName: 'asc' }
    });

    const header = ['name', 'email', 'status', 'reserved_at', 'confirmed_at', 'checked_in_at'].join(',');
    const rows = registrations.map(r => {
      return [
        `"${r.attendeeName.replace(/"/g, '""')}"`,
        `"${r.attendeeEmail.replace(/"/g, '""')}"`,
        r.status,
        r.reservedAt ? r.reservedAt.toISOString() : '',
        r.confirmedAt ? r.confirmedAt.toISOString() : '',
        r.checkedInAt ? r.checkedInAt.toISOString() : ''
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="checkin-sheet-${sessionId}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

import { parse } from 'csv-parse/sync';

export const importRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: sessionId } = req.params;
    
    if (!req.file) {
      throw new AppError('No CSV file uploaded', 400);
    }
    
    const csvContent = req.file.buffer.toString('utf-8');
    
    let records;
    try {
      records = parse(csvContent, { columns: true, skip_empty_lines: true });
    } catch (err) {
      throw new AppError('Invalid CSV format', 400);
    }
    
    const results = [];
    let createdCount = 0;
    let duplicateCount = 0;
    let rejectedCount = 0;
    let rowNumber = 1;

    // We can't use the atomic capacity check cleanly in a loop without repeating it.
    // However, the instructions state: "Check capacity (per-row, within transaction for safety)".
    // So we can extract the atomic creation to a helper or just do it.

    for (const record of records) {
      const row: any = record;
      rowNumber++; // starting from 2 assuming 1 is header
      const name = row.name || row.attendee_name || row.attendeeName;
      const email = row.email || row.attendee_email || row.attendeeEmail;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email || !emailRegex.test(email)) {
        results.push({ row: rowNumber, status: 'rejected', reason: 'Invalid email format', data: row });
        rejectedCount++;
        continue;
      }
      
      if (!name?.trim()) {
        results.push({ row: rowNumber, status: 'rejected', reason: 'Name is required', data: row });
        rejectedCount++;
        continue;
      }

      const existing = await prisma.registration.findFirst({
        where: {
          sessionId,
          attendeeEmail: email.toLowerCase().trim(),
          status: { in: ['reserved', 'confirmed', 'checked_in', 'checked-in'] }
        }
      });

      if (existing) {
        results.push({ row: rowNumber, status: 'duplicate', reason: 'Already registered for this session', data: row });
        duplicateCount++;
        continue;
      }

      try {
        const registration = await prisma.$transaction(async (tx: any) => {
          const sessionList = await tx.$queryRaw<any[]>`SELECT id, capacity FROM sessions WHERE id = ${sessionId}::uuid FOR UPDATE;`;
          if (sessionList.length === 0) throw new Error('Session not found');
          const session = sessionList[0];

          const activeCountList = await tx.$queryRaw<any[]>`
            SELECT COUNT(*)::int as count FROM registrations 
            WHERE "sessionId" = ${sessionId}::uuid AND status NOT IN ('cancelled', 'expired');
          `;
          const activeCount = activeCountList[0].count;

          if (activeCount >= session.capacity) {
            throw new Error('CAPACITY_FULL');
          }

          return await tx.registration.create({
            data: {
              sessionId,
              attendeeName: name.trim(),
              attendeeEmail: email.toLowerCase().trim(),
              status: 'reserved',
              createdById: req.user?.userId
            }
          });
        });
        
        results.push({ row: rowNumber, status: 'created', registrationId: registration.id, data: row });
        createdCount++;
      } catch (error: any) {
        if (error.message === 'CAPACITY_FULL') {
          results.push({ row: rowNumber, status: 'rejected', reason: 'Session at full capacity', data: row });
          rejectedCount++;
        } else {
          results.push({ row: rowNumber, status: 'rejected', reason: 'Unexpected error: ' + error.message, data: row });
          rejectedCount++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        summary: { total: records.length, created: createdCount, duplicates: duplicateCount, rejected: rejectedCount },
        rows: results
      }
    });

  } catch (error) {
    next(error);
  }
};





export const addStaffNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const user = req.user!;

    if (!note) {
      throw new AppError('Note content is required', 400);
    }

    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) {
      throw new AppError('Registration not found', 404);
    }

    const newNote = await prisma.auditLog.create({
      data: {
        registrationId: id,
        action: 'note_added',
        note,
        performedById: user.userId
      }
    });

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const logs = await prisma.auditLog.findMany({
      where: { registrationId: id },
      include: {
        performedBy: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { performedAt: 'desc' }
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
