import prisma from './prisma.js';

export async function checkAndTriggerAlert(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return;

  const activeCount = await prisma.registration.count({
    where: { 
      sessionId, 
      status: { in: ['reserved', 'confirmed', 'checked_in', 'checked-in'] } 
    }
  });

  if (activeCount >= session.capacity) {
    // Upsert: create if not exists, or reset dismissed if exists
    await prisma.capacityAlert.upsert({
      where: { sessionId },
      create: { sessionId },
      update: { 
        isDismissed: false, 
        triggeredAt: new Date(), 
        dismissedById: null, 
        dismissedAt: null 
      }
    });
  }
}
