import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isStaff = user.role === 'CHECK_IN_STAFF';

    let sessionIds: string[] = [];
    if (isStaff) {
      const assigned = await prisma.sessionStaff.findMany({
        where: { userId: user.userId },
        select: { sessionId: true }
      });
      sessionIds = assigned.map(a => a.sessionId);
      if (sessionIds.length === 0) {
        // No sessions assigned to this staff member
        return res.json({
          success: true,
          data: {
            headlines: { sessionsToday: 0, checkedInToday: 0, expiredThisWeek: 0, sessionsAtCapacity: 0 },
            statusBreakdown: [],
            registrationsBySession: [],
            checkinsPerDay: []
          }
        });
      }
    }

    const sessionFilter = isStaff ? { in: sessionIds } : undefined;

    // Headline: Sessions Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sessionsToday = await prisma.session.count({
      where: {
        startTime: { gte: todayStart, lte: todayEnd },
        ...(isStaff && { id: sessionFilter })
      }
    });

    // Headline: Checked In Today
    const checkedInToday = await prisma.registration.count({
      where: {
        status: 'checked_in', // or 'checked-in'
        checkedInAt: { gte: todayStart, lte: todayEnd },
        ...(isStaff && { sessionId: sessionFilter })
      }
    });

    // Headline: Expired This Week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const expiredThisWeek = await prisma.registration.count({
      where: {
        status: 'expired',
        expiredAt: { gte: weekStart },
        ...(isStaff && { sessionId: sessionFilter })
      }
    });

    // Headline: Sessions At Capacity
    let sessionsAtCapacity = 0;
    const allSessions = await prisma.session.findMany({
      where: isStaff ? { id: sessionFilter } : undefined,
      include: {
        _count: {
          select: { registrations: { where: { status: { in: ['reserved', 'confirmed', 'checked_in', 'checked-in'] } } } }
        }
      }
    });
    for (const s of allSessions) {
      if (s._count.registrations >= s.capacity) {
        sessionsAtCapacity++;
      }
    }

    // Breakdown: Status
    const statusGroups = await prisma.registration.groupBy({
      by: ['status'],
      _count: true,
      where: isStaff ? { sessionId: sessionFilter } : undefined
    });
    const statusBreakdown = statusGroups.map(g => ({ status: g.status, count: g._count }));

    // Registrations by Session
    const regsBySession = await prisma.session.findMany({
      where: isStaff ? { id: sessionFilter } : undefined,
      select: { id: true, title: true, capacity: true, _count: { select: { registrations: { where: { status: { in: ['reserved', 'confirmed', 'checked_in', 'checked-in'] } } } } } },
      orderBy: { registrations: { _count: 'desc' } },
      take: 10
    });
    const registrationsBySession = regsBySession.map(s => ({
      sessionId: s.id,
      title: s.title,
      capacity: s.capacity,
      count: s._count.registrations
    })).sort((a, b) => b.count - a.count);

    // Check-ins Per Day (14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.setHours(0, 0, 0, 0);

    const checkins = await prisma.registration.findMany({
      where: {
        status: { in: ['checked_in', 'checked-in'] },
        checkedInAt: { gte: twoWeeksAgo },
        ...(isStaff && { sessionId: sessionFilter })
      },
      select: { checkedInAt: true }
    });

    const checkinsMap: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(twoWeeksAgo);
      d.setDate(d.getDate() + i + 1); // 1 to 14
      checkinsMap[d.toISOString().split('T')[0]] = 0;
    }

    checkins.forEach(c => {
      if (c.checkedInAt) {
        const d = c.checkedInAt.toISOString().split('T')[0];
        if (checkinsMap[d] !== undefined) {
          checkinsMap[d]++;
        }
      }
    });

    const checkinsPerDay = Object.keys(checkinsMap).sort().map(date => ({
      date,
      count: checkinsMap[date]
    }));

    res.json({
      success: true,
      data: {
        headlines: {
          sessionsToday,
          checkedInToday,
          expiredThisWeek,
          sessionsAtCapacity
        },
        statusBreakdown,
        registrationsBySession,
        checkinsPerDay
      }
    });

  } catch (error) {
    next(error);
  }
};
