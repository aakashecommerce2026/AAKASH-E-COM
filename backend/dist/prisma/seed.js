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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const adminEmail = 'admin@aakashecom.com';
    const adminMobile = '9999999999';
    const adminCode = 'ADM-0001';
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
    const rawPassword = 'Admin@123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);
    const admin = await prisma.member.create({
        data: {
            memberCode: adminCode,
            name: 'Super Admin',
            mobile: adminMobile,
            email: adminEmail,
            address: 'Corporate Headquarters, AAKASH E-COM',
            role: client_1.MemberRole.ADMIN,
            status: client_1.MemberStatus.ACTIVE,
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
main()
    .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map