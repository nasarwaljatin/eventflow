import prisma from '../lib/prisma.js';

const RESERVATION_HOLD_MINUTES = Number(process.env.RESERVATION_HOLD_MINUTES) || 15;

export const startExpirationJob = () => {
  // Run every minute
  setInterval(async () => {
    try {
      const expirationTime = new Date(Date.now() - RESERVATION_HOLD_MINUTES * 60 * 1000);
      
      const result = await prisma.registration.updateMany({
        where: {
          status: 'reserved',
          reservedAt: {
            lt: expirationTime
          }
        },
        data: {
          status: 'expired',
          expiredAt: new Date()
        }
      });
      
      if (result.count > 0) {
        console.log(`[Job] Auto-expired ${result.count} reservations.`);
      }
    } catch (error) {
      console.error('[Job] Error auto-expiring reservations:', error);
    }
  }, 60 * 1000);
  
  console.log('[Job] Reservation auto-expiration job started.');
};
