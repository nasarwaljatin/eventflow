import { beforeAll, afterAll, afterEach } from 'vitest';
import prisma from '../src/lib/prisma.js';
import { execSync } from 'child_process';

beforeAll(() => {
  // We assume a separate test database is configured in .env.test
  // and Prisma schema is pushed. We can also optionally migrate here.
  // execSync('npx prisma migrate reset --force --skip-seed');
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Truncate tables between tests for clean state
  const tables = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';`;

  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        console.error({ error });
      }
    }
  }
});
