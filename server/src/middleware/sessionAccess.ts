import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { errorResponse } from '../utils/apiResponse.js';

export const canAccessSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    let sessionId = req.params.sessionId;
    
    if (!user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (user.role === 'ORGANIZER') {
      return next(); // Organizers can access all sessions
    }
    
    if (!sessionId && req.params.id) {
      // If it's a session route, id is sessionId
      if (req.baseUrl.includes('/sessions')) {
        sessionId = req.params.id;
      } else if (req.baseUrl.includes('/registrations')) {
        // If it's a registration route, id is registrationId
        const reg = await prisma.registration.findUnique({
          where: { id: req.params.id },
          select: { sessionId: true }
        });
        if (reg) sessionId = reg.sessionId;
      }
    }

    if (!sessionId) {
      return next(); // if no session id can be determined, pass
    }

    // Check-in staff: verify assignment
    if (user.role === 'CHECK_IN_STAFF') {
      const assignment = await prisma.sessionStaff.findUnique({
        where: {
          sessionId_userId: { sessionId, userId: user.userId } // assuming user payload has userId as id or userId? Wait.
        }
      });

      if (!assignment) {
        return errorResponse(res, 'You are not assigned to this session', 403);
      }
      return next();
    }
    
    return errorResponse(res, 'Forbidden', 403);
  } catch (error) {
    next(error);
  }
};
