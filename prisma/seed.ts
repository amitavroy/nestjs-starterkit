import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { ulid } from 'ulid';
import { faker } from '@faker-js/faker';

const SALT_ROUNDS = 10;

async function main(): Promise<void> {
  if (process.env.APP_ENV === 'production') {
    console.log('Skipping seed in production');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedUsers(prisma);
    console.log('Seeding completed successfully');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function seedUsers(prisma: PrismaClient): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';
  const userCount = parseInt(process.env.SEED_USER_COUNT || '10', 10);
  const userPassword = process.env.SEED_USER_PASSWORD || 'password123';

  // Upsert admin user
  const hashedAdminPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: ulid(),
      name: 'Admin',
      email: adminEmail,
      password: hashedAdminPassword,
    },
  });

  console.log(`Admin user ensured: ${adminEmail}`);

  // Generate and insert fake users
  const hashedUserPassword = await bcrypt.hash(userPassword, SALT_ROUNDS);
  const fakeUsers = Array.from({ length: userCount }).map(() => ({
    id: ulid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: hashedUserPassword,
  }));

  try {
    await prisma.user.createMany({
      data: fakeUsers,
      skipDuplicates: true,
    });
    console.log(`Generated and inserted fake users (up to ${userCount})`);
  } catch (error) {
    console.error('Error inserting fake users:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
