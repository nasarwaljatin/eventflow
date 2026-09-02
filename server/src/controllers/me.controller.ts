import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const getMySessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const assignments = await prisma.sessionStaff.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            event: true
          }
        }
      }
    });

    const sessions = assignments.map(a => a.session);

    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};
