import { PrismaClient, MemberRole, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = 'aakashecommerce2000@gmail.com';
  const adminMobile = '+919876543210';
  const rawPassword = 'Aakash.Emart@2000';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existingAdmin = await prisma.member.findFirst({
    where: {
      OR: [{ email: adminEmail }, { mobile: adminMobile }, { role: MemberRole.ADMIN }],
    },
  });

  let admin: any;
  if (existingAdmin) {
    console.log('ℹ️ Admin user already exists:', existingAdmin.memberCode);
    admin = existingAdmin;
  } else {
    admin = await prisma.member.create({
      data: {
        memberCode: 'AK100000',
        name: 'System Administrator',
        email: adminEmail,
        mobile: adminMobile,
        passwordHash: hashedPassword,
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
        bankDetails: {
          accountName: 'System Administrator',
          accountNumber: '999900001111',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
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
  }

  // Seed standard demo members AK10001 - AK10005
  const demoMembers = [
    { memberCode: 'AK10001', name: 'Rajesh Kumar', email: 'rajesh.kumar@aakashecom.com', mobile: '+919811122233' },
    { memberCode: 'AK10002', name: 'Priya Sharma', email: 'priya.sharma@aakashecom.com', mobile: '+919822233344' },
    { memberCode: 'AK10003', name: 'Amit Patel', email: 'amit.patel@aakashecom.com', mobile: '+919833344455' },
    { memberCode: 'AK10004', name: 'Sanjay V', email: 'sanjay.v@aakashecom.com', mobile: '+919844455566' },
    { memberCode: 'AK10005', name: 'Deepa Nair', email: 'deepa.nair@aakashecom.com', mobile: '+919855566677' },
  ];

  for (const m of demoMembers) {
    const exists = await prisma.member.findUnique({ where: { memberCode: m.memberCode } });
    if (!exists) {
      await prisma.member.create({
        data: {
          memberCode: m.memberCode,
          name: m.name,
          email: m.email,
          mobile: m.mobile,
          passwordHash: hashedPassword,
          role: MemberRole.MEMBER,
          status: MemberStatus.ACTIVE,
          referrerId: admin.id,
        },
      });
      console.log(`✅ Seeded demo member: ${m.memberCode} (${m.name})`);
    }
  }

  await seedMembershipCommissionConfig(prisma);
  await seedRepurchaseCommissionConfig(prisma);
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

export async function seedRepurchaseCommissionConfig(prismaClient: any) {
  const version = 1;
  const existingConfig = await (prismaClient as any).repurchaseCommissionConfig.findFirst({
    where: { version },
  });

  if (existingConfig) {
    console.log(`ℹ️ Version ${version} Repurchase Commission Config already seeded.`);
    return;
  }

  const defaultRates: { level: number; percentage: number; description?: string }[] = [
    { level: 1, percentage: 1.50, description: 'Level 1 Repurchase Commission' },
    { level: 2, percentage: 0.75, description: 'Level 2 Repurchase Commission' },
    { level: 3, percentage: 0.45, description: 'Level 3 Repurchase Commission' },
    { level: 4, percentage: 0.30, description: 'Level 4 Repurchase Commission' },
    { level: 5, percentage: 0.20, description: 'Level 5 Repurchase Commission' },
    ...Array.from({ length: 10 }, (_, i) => ({
      level: i + 6,
      percentage: 0.15,
      description: `Level ${i + 6} Repurchase Commission`,
    })),
    { level: 16, percentage: 0.07, description: 'Level 16 Repurchase Commission' },
    { level: 17, percentage: 0.06, description: 'Level 17 Repurchase Commission' },
    { level: 18, percentage: 0.06, description: 'Level 18 Repurchase Commission' },
    { level: 19, percentage: 0.06, description: 'Level 19 Repurchase Commission' },
    { level: 20, percentage: 0.05, description: 'Level 20 Repurchase Commission' },
  ];

  await (prismaClient as any).repurchaseCommissionConfig.createMany({
    data: defaultRates.map((r) => ({
      version,
      level: r.level,
      percentage: r.percentage,
      isActive: true,
      description: r.description,
    })),
  });

  console.log(`✅ Seeded Version ${version} 20-Level Repurchase Commission Config (1.50%, 0.75%...0.05% = 5.00%)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
