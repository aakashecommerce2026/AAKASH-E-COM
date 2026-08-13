import { PrismaClient, MemberRole, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminEmail = 'admin@aakashecom.com';
  const adminMobile = '9999999999';
  const adminCode = 'ADM-0001';

  // Check if admin already exists
  const existingAdmin = await prisma.member.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { mobile: adminMobile },
        { memberCode: adminCode },
      ],
    },
  });

  if (existingAdmin) {
    console.log(`ℹ️ Admin user already exists: ${existingAdmin.email} (${existingAdmin.memberCode})`);
    return;
  }

  // Hash password
  const rawPassword = 'Admin@123';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  // Create initial Admin user
  const admin = await prisma.member.create({
    data: {
      memberCode: adminCode,
      name: 'Super Admin',
      mobile: adminMobile,
      email: adminEmail,
      address: 'Corporate Headquarters, AAKASH E-COM',
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
      passwordHash: passwordHash,
      upiId: 'admin@upi',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '50100234567890',
        ifscCode: 'HDFC0001234',
        branch: 'Main Branch',
      },
    },
  });

  console.log('✅ Initial Admin user created successfully!');
  console.log(`   - Member Code: ${admin.memberCode}`);
  console.log(`   - Email:       ${admin.email}`);
  console.log(`   - Mobile:      ${admin.mobile}`);
  console.log(`   - Password:    ${rawPassword}`);
  console.log(`   - Role:        ${admin.role}`);

  await seedMembershipCommissionConfig(prisma);
}

export async function seedMembershipCommissionConfig(prismaClient: any) {
  const version = 1;
  const existingConfig = await (prismaClient as any).membershipCommissionConfig.findFirst({
    where: { version },
  });

  if (existingConfig) {
    console.log(`ℹ️ Version ${version} Membership Commission Config already seeded.`);
    return;
  }

  const defaultRates: { level: number; percentage: number; description?: string }[] = [
    { level: 1, percentage: 10.0, description: 'Level 1 Sponsor Commission' },
    { level: 2, percentage: 5.0, description: 'Level 2 Direct Upline Commission' },
    { level: 3, percentage: 2.5, description: 'Level 3 Upline Commission' },
    { level: 4, percentage: 1.5, description: 'Level 4 Upline Commission' },
    { level: 5, percentage: 1.0, description: 'Level 5 Upline Commission' },
    { level: 6, percentage: 0.75, description: 'Level 6 Upline Commission' },
    ...Array.from({ length: 14 }, (_, i) => ({
      level: i + 7,
      percentage: 0.5,
      description: `Level ${i + 7} Upline Commission`,
    })),
  ];

  await (prismaClient as any).membershipCommissionConfig.createMany({
    data: defaultRates.map((r) => ({
      version,
      level: r.level,
      percentage: r.percentage,
      isActive: true,
      description: r.description,
    })),
  });

  console.log(`✅ Seeded Version ${version} 20-Level Membership Commission Config (10%, 5%, 2.5%...0.5%)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
