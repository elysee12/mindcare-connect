import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MindCare database...');

  // 1. Cleanup existing data (Optional, but recommended for clean seeds)
  await prisma.systemLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.followup.deleteMany();
  await prisma.treatmentChange.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const hashPassword = async (plain: string) => await bcrypt.hash(plain, 10);

  // Create only Admin
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@mindcare.com',
      password: await hashPassword('Admin123'),
      role: 'ADMIN',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create sample system logs
  await prisma.systemLog.createMany({
    data: [
      {
        event: 'System initialized',
        userId: admin.id,
      },
      {
        event: 'Admin user created',
        userId: admin.id,
      },
      {
        event: 'Database seeded successfully',
        userId: admin.id,
      },
      {
        event: 'Application startup completed',
      },
    ],
  });
  console.log('✅ Created sample system logs');

  console.log('\n🚀 Seed complete!');
  console.log('📝 Credentials for user:');
  console.log('   Admin: admin@mindcare.com / Admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
