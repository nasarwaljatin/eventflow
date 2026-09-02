import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import prisma from '../../src/lib/prisma.js';

describe('Audit Log Immutability', () => {
  let auditId: string;
  let userCookie: string;

  beforeEach(async () => {
    // We assume test setup will do proper data population,
    // but here we just test the endpoints.

    const user = await prisma.user.create({
      data: {
        email: 'audit@example.com',
        passwordHash: 'hashed',
        fullName: 'Audit User',
        role: 'ORGANIZER',
      }
    });

    const event = await prisma.event.create({
      data: { name: 'E', venue: 'V', startDate: new Date(), endDate: new Date(), createdById: user.id }
    });

    const session = await prisma.session.create({
      data: { eventId: event.id, title: 'S', startTime: new Date(), durationMin: 60, location: 'L', capacity: 10 }
    });

    const registration = await prisma.registration.create({
      data: { sessionId: session.id, attendeeName: 'A', attendeeEmail: 'a@a.com', status: 'reserved' }
    });

    const audit = await prisma.auditLog.create({
      data: {
        registrationId: registration.id,
        action: 'status_changed',
        newStatus: 'confirmed',
        oldStatus: 'reserved',
        performedById: user.id
      }
    });
    
    auditId = audit.id;

    // Simulate login for cookies (we can skip if endpoints are entirely missing)
  });

  it('has no update endpoint', async () => {
    const res = await request(app).patch(`/api/audit/${auditId}`).send({ note: 'tampered' });
    expect(res.status).toBe(404);
  });

  it('has no delete endpoint', async () => {
    const res = await request(app).delete(`/api/audit/${auditId}`);
    expect(res.status).toBe(404);
  });
});
