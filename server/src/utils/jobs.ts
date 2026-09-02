import prisma from '../lib/prisma.js';
import { checkAndTriggerAlert } from '../lib/alerts.js';

const RESERVATION_HOLD_MINUTES = Number(process.env.RESERVATION_HOLD_MINUTES) || 15;

export const startExpirationJob = () => {
  // Run every minute
  setInterval(async () => {
    try {
      const expirationTime = new Date(Date.now() - RESERVATION_HOLD_MINUTES * 60 * 1000);
      
      const expiredRegs = await prisma.registration.findMany({
        where: {
          status: 'reserved',
          reservedAt: { lt: expirationTime }
        }
      });

      if (expiredRegs.length > 0) {
        await prisma.$transaction(
          expiredRegs.map(reg => prisma.registration.update({
            where: { id: reg.id },
            data: { status: 'expired', expiredAt: new Date() }
          })).concat(
            expiredRegs.map(reg => prisma.auditLog.create({
              data: {
                registrationId: reg.id,
                action: 'status_changed',
                oldStatus: 'reserved',
                newStatus: 'expired',
                performedById: null
              }
            })) as any
          )
        );

        for (const reg of expiredRegs) {
          await checkAndTriggerAlert(reg.sessionId);
        }

        console.log(`[Job] Auto-expired ${expiredRegs.length} reservations.`);
      }
      
    } catch (error) {
      console.error('[Job] Error auto-expiring reservations:', error);
    }
  }, 60 * 1000);
  
  console.log('[Job] Reservation auto-expiration job started.');
};
