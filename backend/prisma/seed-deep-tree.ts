import { PrismaClient, MemberRole, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting deep referral tree seed script (22+ levels)...');

  const BCRYPT_SALT_ROUNDS = 12;
  const commonPasswordHash = await bcrypt.hash('TreeP@ss123!', BCRYPT_SALT_ROUNDS);

  // 1. Ensure Root Sponsor exists
  let rootMember = await prisma.member.findFirst({
    where: { role: MemberRole.ADMIN },
  });

  if (!rootMember) {
    rootMember = await prisma.member.create({
      data: {
        memberCode: 'TREE-ROOT',
        name: 'Root System Sponsor',
        mobile: '+919000000000',
        email: 'root.tree@aakashecom.com',
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
        passwordHash: commonPasswordHash,
      },
    });
    console.log(`✅ Created Root Sponsor: ${rootMember.memberCode} (${rootMember.id})`);
  } else {
    console.log(`ℹ️ Using existing Root Sponsor: ${rootMember.memberCode} (${rootMember.id})`);
  }

  let parentId = rootMember.id;
  const createdNodes: string[] = [];

  // 2. Build a 22-level deep primary leg + side branches
  for (let level = 1; level <= 22; level++) {
    const padLevel = level.toString().padStart(2, '0');
    const memberCode = `TREE-LVL-${padLevel}`;
    const mobile = `+919000000${padLevel.padStart(3, '0')}`;
    const email = `level${padLevel}@tree.test`;

    const member = await prisma.member.upsert({
      where: { memberCode },
      update: {
        referrerId: parentId,
        status: MemberStatus.ACTIVE,
      },
      create: {
        memberCode,
        name: `Tree Node Level ${level}`,
        mobile,
        email,
        referrerId: parentId,
        role: MemberRole.MEMBER,
        status: MemberStatus.ACTIVE,
        passwordHash: commonPasswordHash,
      },
    });

    createdNodes.push(member.id);
    parentId = member.id; // Next level connects to this member

    // 3. Add side branches at levels 1, 3, 5, 10, 15
    if ([1, 3, 5, 10, 15].includes(level)) {
      for (let branch = 1; branch <= 2; branch++) {
        const branchCode = `TREE-L${padLevel}-B${branch}`;
        const branchMobile = `+9191000${level.toString().padStart(2, '0')}${branch.toString().padStart(2, '0')}`;

        await prisma.member.upsert({
          where: { memberCode: branchCode },
          update: {
            referrerId: member.id,
            status: MemberStatus.ACTIVE,
          },
          create: {
            memberCode: branchCode,
            name: `Side Branch L${level}-B${branch}`,
            mobile: branchMobile,
            email: `branch_l${padLevel}_b${branch}@tree.test`,
            referrerId: member.id,
            role: MemberRole.MEMBER,
            status: MemberStatus.ACTIVE,
            passwordHash: commonPasswordHash,
          },
        });
      }
    }
  }

  const totalMembers = await prisma.member.count();

  console.log(`✅ Deep referral tree seeded successfully!`);
  console.log(`   - Deepest Level Created: Level 22`);
  console.log(`   - Total Members in Database: ${totalMembers}`);
  console.log(`   - Root Sponsor ID: ${rootMember.id}`);
  console.log(`   - Level 22 Member ID: ${parentId}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding deep tree failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
