import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const organizerPassword = await bcrypt.hash('Demo1234!', 12);
  const staffPassword = await bcrypt.hash('Demo1234!', 12);

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@demo.com' },
    update: {},
    create: {
      email: 'organizer@demo.com',
      passwordHash: organizerPassword,
      role: Role.ORGANIZER,
      fullName: 'Sarah Chen',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      email: 'staff@demo.com',
      passwordHash: staffPassword,
      role: Role.CHECK_IN_STAFF,
      fullName: 'Mike Johnson',
    },
  });

  const today = new Date();
  const plus2 = new Date(); plus2.setDate(today.getDate() + 2);
  const plus7 = new Date(); plus7.setDate(today.getDate() + 7);
  const plus11 = new Date(); plus11.setDate(today.getDate() + 11);

  await prisma.event.createMany({
    data: [
      {
        name: 'Tech Summit 2026',
        description: 'Annual tech summit',
        venue: 'Convention Center',
        startDate: today,
        endDate: plus2,
        createdById: organizer.id,
      },
      {
        name: 'Design Workshop Week',
        description: 'Interactive design sessions',
        venue: 'Innovation Hub',
        startDate: plus7,
        endDate: plus11,
        createdById: organizer.id,
      },
      {
        name: 'Past Conference 2025',
        description: 'Last years conference',
        venue: 'Hotel Plaza',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-03'),
        isArchived: true,
        createdById: organizer.id,
      },
    ],
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
