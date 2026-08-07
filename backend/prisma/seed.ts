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
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
