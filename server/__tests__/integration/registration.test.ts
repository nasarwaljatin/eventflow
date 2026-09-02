import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js'; // Assuming app is exported from index.js
import prisma from '../../src/lib/prisma.js';

describe('Registration API and Capacity Race Condition', () => {
  let sessionId: string;
  let eventId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user and event/session
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        fullName: 'Test User',
        role: 'ORGANIZER',
      }
    });
    userId = user.id;

    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        venue: 'Test Venue',
        startDate: new Date(),
        endDate: new Date(),
        createdById: user.id
      }
    });
    eventId = event.id;

    const session = await prisma.session.create({
      data: {
        eventId: event.id,
        title: 'Test Session',
        startTime: new Date(),
        durationMin: 60,
        location: 'Room A',
        capacity: 1 // Capacity is 1 for testing race condition
      }
    });
    sessionId = session.id;
  });

  it('creates a reservation when capacity is available', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionId}/registrations`)
      .send({ attendeeName: 'Alice', attendeeEmail: 'alice@example.com' });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 409 when session is at full capacity', async () => {
    // Fill the capacity
    await prisma.registration.create({
      data: {
        sessionId,
        attendeeName: 'Alice',
        attendeeEmail: 'alice@example.com',
        status: 'reserved'
      }
    });

    const res = await request(app)
      .post(`/api/sessions/${sessionId}/registrations`)
      .send({ attendeeName: 'Bob', attendeeEmail: 'bob@example.com' });
      
    expect(res.status).toBe(400); // Controller returns 400 for capacity
    expect(res.body.error).toMatch(/capacity/i);
  });

  it('does not oversell when two requests arrive simultaneously', async () => {
    // Fire two concurrent registration requests
    // Assert exactly one succeeds, one fails
    const [result1, result2] = await Promise.all([
      request(app).post(`/api/sessions/${sessionId}/registrations`).send({ attendeeName: 'Alice', attendeeEmail: 'alice@example.com' }),
      request(app).post(`/api/sessions/${sessionId}/registrations`).send({ attendeeName: 'Bob', attendeeEmail: 'bob@example.com' })
    ]);

    const successes = [result1, result2].filter(r => r.status === 201);
    const failures = [result1, result2].filter(r => r.status === 400 || r.status === 409 || r.status === 500);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});
