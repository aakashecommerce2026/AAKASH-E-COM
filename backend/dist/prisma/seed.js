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
exports.seedMembershipCommissionConfig = seedMembershipCommissionConfig;
exports.seedRepurchaseCommissionConfig = seedRepurchaseCommissionConfig;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const adminEmail = 'admin@aakashecom.com';
    const adminMobile = '+919876543210';
    const rawPassword = 'Admin@123456Password';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const existingAdmin = await prisma.member.findFirst({
        where: {
            OR: [{ email: adminEmail }, { mobile: adminMobile }, { role: client_1.MemberRole.ADMIN }],
        },
    });
    let admin;
    if (existingAdmin) {
        console.log('ℹ️ Admin user already exists:', existingAdmin.memberCode);
        admin = existingAdmin;
    }
    else {
        admin = await prisma.member.create({
            data: {
                memberCode: 'AK100000',
                name: 'System Administrator',
                email: adminEmail,
                mobile: adminMobile,
                passwordHash: hashedPassword,
                role: client_1.MemberRole.ADMIN,
                status: client_1.MemberStatus.ACTIVE,
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
    await seedMembershipCommissionConfig(prisma);
    await seedRepurchaseCommissionConfig(prisma);
}
async function seedMembershipCommissionConfig(prismaClient) {
    const version = 1;
    const existingConfig = await prismaClient.membershipCommissionConfig.findFirst({
        where: { version },
    });
    if (existingConfig) {
        console.log(`ℹ️ Version ${version} Membership Commission Config already seeded.`);
        return;
    }
    const defaultRates = [
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
    await prismaClient.membershipCommissionConfig.createMany({
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
async function seedRepurchaseCommissionConfig(prismaClient) {
    const version = 1;
    const existingConfig = await prismaClient.repurchaseCommissionConfig.findFirst({
        where: { version },
    });
    if (existingConfig) {
        console.log(`ℹ️ Version ${version} Repurchase Commission Config already seeded.`);
        return;
    }
    const defaultRates = [
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
    await prismaClient.repurchaseCommissionConfig.createMany({
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
//# sourceMappingURL=seed.js.map