import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await prisma.capacityAlert.findMany({
      where: { isDismissed: false },
      include: {
        session: {
          select: { title: true, event: { select: { name: true } }, capacity: true, _count: { select: { registrations: { where: { status: { in: ['reserved', 'confirmed', 'checked_in', 'checked-in'] } } } } } }
        }
      },
      orderBy: { triggeredAt: 'desc' }
    });

    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

export const getAlertsCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.capacityAlert.count({
      where: { isDismissed: false }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

export const dismissAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'ORGANIZER') {
      return res.status(403).json({ success: false, error: 'Only organizers can dismiss alerts' });
    }

    const alert = await prisma.capacityAlert.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedById: user.userId,
        dismissedAt: new Date()
      }
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};
