import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // Use raw SQL to handle Supabase referential integrity
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE audit_log, capacity_alerts, registrations, session_staff, refresh_tokens, sessions, events, users CASCADE`);

  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const adminPasswordHash = await bcrypt.hash('Admin1234!', 12);

  const organizer = await prisma.user.create({
    data: { email: 'organizer@demo.com', passwordHash, role: Role.ORGANIZER, fullName: 'Sarah Chen' },
  });

  const staff1 = await prisma.user.create({
    data: { email: 'staff1@demo.com', passwordHash, role: Role.CHECK_IN_STAFF, fullName: 'Mike Johnson' },
  });

  const staff2 = await prisma.user.create({
    data: { email: 'staff2@demo.com', passwordHash, role: Role.CHECK_IN_STAFF, fullName: 'Emily Davis' },
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@eventflow.com', passwordHash: adminPasswordHash, role: Role.ADMIN, fullName: 'System Admin' },
  });

  const today = new Date();
  const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };

  const event1 = await prisma.event.create({
    data: {
      name: 'Tech Summit 2026',
      description: 'Annual technology conference featuring industry leaders...',
      venue: 'Grand Convention Center',
      startDate: today,
      endDate: addDays(today, 2),
      createdById: organizer.id,
      approvalStatus: 'APPROVED'
    }
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'Design Workshop Week',
      description: 'A week of hands-on UX/UI workshops...',
      venue: 'Creative Hub Studio',
      startDate: addDays(today, 7),
      endDate: addDays(today, 11),
      createdById: organizer.id,
      approvalStatus: 'APPROVED'
    }
  });

  const archivedEvent = await prisma.event.create({
    data: {
      name: 'Past Conference 2025',
      description: 'Archived event',
      venue: 'Old Center',
      startDate: addDays(today, -365),
      endDate: addDays(today, -363),
      isArchived: true,
      createdById: organizer.id,
      approvalStatus: 'APPROVED'
    }
  });

  const today_9am = new Date(today); today_9am.setHours(9, 0, 0, 0);
  const today_11am = new Date(today); today_11am.setHours(11, 0, 0, 0);
  const tomorrow_2pm = addDays(today, 1); tomorrow_2pm.setHours(14, 0, 0, 0);

  const keynote = await prisma.session.create({
    data: { eventId: event1.id, title: 'Opening Keynote', capacity: 50, startTime: today_9am, durationMin: 90, location: 'Main Hall' }
  });

  const workshop = await prisma.session.create({
    data: { eventId: event1.id, title: 'Advanced React Patterns', capacity: 30, startTime: today_11am, durationMin: 120, location: 'Room B' }
  });

  const panel = await prisma.session.create({
    data: { eventId: event1.id, title: 'Future of AI Panel', capacity: 40, startTime: tomorrow_2pm, durationMin: 60, location: 'Room C' }
  });

  // Assignments
  await prisma.sessionStaff.createMany({
    data: [
      { sessionId: keynote.id, userId: staff1.id, assignedById: organizer.id },
      { sessionId: workshop.id, userId: staff1.id, assignedById: organizer.id },
      { sessionId: workshop.id, userId: staff2.id, assignedById: organizer.id },
      { sessionId: panel.id, userId: staff2.id, assignedById: organizer.id }
    ]
  });

  // Helper to create registrations
  const createRegs = async (sessionId: string, count: number, statuses: {status: string, chance: number}[]) => {
    const regs = [];
    for (let i = 0; i < count; i++) {
      let r = Math.random();
      let status = 'reserved';
      for (const s of statuses) {
        if (r < s.chance) { status = s.status; break; }
        r -= s.chance;
      }
      
      const reservedAt = addDays(today, -Math.floor(Math.random() * 14));
      
      const reg = await prisma.registration.create({
        data: {
          sessionId,
          attendeeName: `Attendee ${sessionId.slice(0,4)} ${i}`,
          attendeeEmail: `attendee_${sessionId.slice(0,4)}_${i}@demo.com`,
          status: status === 'checked_in' ? 'checked-in' : status,
          reservedAt,
          confirmedAt: status !== 'reserved' ? addDays(reservedAt, 1) : null,
          checkedInAt: status === 'checked_in' ? addDays(reservedAt, 2) : null,
          cancelledAt: status === 'cancelled' ? addDays(reservedAt, 1) : null,
          expiredAt: status === 'expired' ? addDays(reservedAt, 1) : null,
        }
      });
      regs.push(reg);

      await prisma.auditLog.create({
        data: {
          registrationId: reg.id,
          action: 'status_changed',
          newStatus: reg.status,
          oldStatus: 'reserved',
          note: i % 10 === 0 ? 'VIP guest' : null,
          performedAt: reservedAt
        }
      });
    }
    return regs;
  };

  // 48/50 for keynote
  await createRegs(keynote.id, 48, [{status: 'checked_in', chance: 0.6}, {status: 'confirmed', chance: 0.3}, {status: 'reserved', chance: 0.1}]);
  // 30/30 for workshop
  await createRegs(workshop.id, 30, [{status: 'confirmed', chance: 0.8}, {status: 'reserved', chance: 0.2}]);
  // 15/40 for panel
  await createRegs(panel.id, 15, [{status: 'reserved', chance: 0.5}, {status: 'cancelled', chance: 0.2}, {status: 'expired', chance: 0.3}]);
  // extras that are cancelled
  await createRegs(keynote.id, 5, [{status: 'cancelled', chance: 1.0}]);

  await prisma.capacityAlert.create({
    data: {
      sessionId: workshop.id,
      isDismissed: false
    }
  });
  
  await prisma.capacityAlert.create({
    data: {
      sessionId: keynote.id,
      isDismissed: true,
      dismissedById: organizer.id,
      dismissedAt: today
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
