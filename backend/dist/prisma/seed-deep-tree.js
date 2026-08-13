"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const seed_1 = require("./seed");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting deep referral tree seed script (22+ levels)...');
    const BCRYPT_SALT_ROUNDS = 12;
    const commonPasswordHash = await bcrypt.hash('TreeP@ss123!', BCRYPT_SALT_ROUNDS);
    let rootMember = await prisma.member.findFirst({
        where: { role: client_1.MemberRole.ADMIN },
    });
    if (!rootMember) {
        rootMember = await prisma.member.create({
            data: {
                memberCode: 'TREE-ROOT',
                name: 'Root System Sponsor',
                mobile: '+919000000000',
                email: 'root.tree@aakashecom.com',
                role: client_1.MemberRole.ADMIN,
                status: client_1.MemberStatus.ACTIVE,
                passwordHash: commonPasswordHash,
            },
        });
        console.log(`✅ Created Root Sponsor: ${rootMember.memberCode} (${rootMember.id})`);
    }
    else {
        console.log(`ℹ️ Using existing Root Sponsor: ${rootMember.memberCode} (${rootMember.id})`);
    }
    let parentId = rootMember.id;
    const createdNodes = [];
    for (let level = 1; level <= 22; level++) {
        const padLevel = level.toString().padStart(2, '0');
        const memberCode = `TREE-LVL-${padLevel}`;
        const mobile = `+919000000${padLevel.padStart(3, '0')}`;
        const email = `level${padLevel}@tree.test`;
        const member = await prisma.member.upsert({
            where: { memberCode },
            update: {
                referrerId: parentId,
                status: client_1.MemberStatus.ACTIVE,
            },
            create: {
                memberCode,
                name: `Tree Node Level ${level}`,
                mobile,
                email,
                referrerId: parentId,
                role: client_1.MemberRole.MEMBER,
                status: client_1.MemberStatus.ACTIVE,
                passwordHash: commonPasswordHash,
            },
        });
        createdNodes.push(member.id);
        parentId = member.id;
        if ([1, 3, 5, 10, 15].includes(level)) {
            for (let branch = 1; branch <= 2; branch++) {
                const branchCode = `TREE-L${padLevel}-B${branch}`;
                const branchMobile = `+9191000${level.toString().padStart(2, '0')}${branch.toString().padStart(2, '0')}`;
                await prisma.member.upsert({
                    where: { memberCode: branchCode },
                    update: {
                        referrerId: member.id,
                        status: client_1.MemberStatus.ACTIVE,
                    },
                    create: {
                        memberCode: branchCode,
                        name: `Side Branch L${level}-B${branch}`,
                        mobile: branchMobile,
                        email: `branch_l${padLevel}_b${branch}@tree.test`,
                        referrerId: member.id,
                        role: client_1.MemberRole.MEMBER,
                        status: client_1.MemberStatus.ACTIVE,
                        passwordHash: commonPasswordHash,
                    },
                });
            }
        }
    }
    const totalMembers = await prisma.member.count();
    await (0, seed_1.seedMembershipCommissionConfig)(prisma);
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
//# sourceMappingURL=seed-deep-tree.js.map