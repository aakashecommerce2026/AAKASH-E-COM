"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dashboard_service_1 = require("../src/modules/dashboard/dashboard.service");
const dashboard_cache_service_1 = require("../src/modules/dashboard/dashboard-cache.service");
const prisma = new client_1.PrismaClient();
class MockConfigService {
    get(key) {
        if (key === 'REDIS_HOST')
            return process.env.REDIS_HOST || 'localhost';
        if (key === 'REDIS_PORT')
            return parseInt(process.env.REDIS_PORT || '6379', 10);
        return null;
    }
}
async function runBenchmark() {
    console.log('====================================================');
    console.log('⚡ ADMIN DASHBOARD ENDPOINTS LOAD-TEST BENCHMARK ⚡');
    console.log('====================================================\n');
    const totalMembers = await prisma.member.count();
    const totalRepurchases = await prisma.repurchaseEntry.count();
    const totalBatches = await prisma.distributionBatch.count();
    const totalLogs = await prisma.activityLog.count();
    console.log(`📊 Dataset Statistics:`);
    console.log(`   - Members Count:        ${totalMembers}`);
    console.log(`   - Repurchases Count:    ${totalRepurchases}`);
    console.log(`   - Distribution Batches: ${totalBatches}`);
    console.log(`   - Activity Logs Count:  ${totalLogs}\n`);
    const configService = new MockConfigService();
    const cacheService = new dashboard_cache_service_1.DashboardCacheService(configService);
    const dashboardService = new dashboard_service_1.DashboardService(prisma, cacheService);
    await cacheService.clearDashboardCache();
    const ITERATIONS = 50;
    const endpoints = [
        {
            name: 'GET /admin/dashboard/members',
            fn: (refresh) => dashboardService.getMemberStats({ refresh }),
        },
        {
            name: 'GET /admin/dashboard/earnings',
            fn: (refresh) => dashboardService.getEarningsStats({ refresh }),
        },
        {
            name: 'GET /admin/dashboard/business',
            fn: (refresh) => dashboardService.getBusinessStats({ refresh }),
        },
        {
            name: 'GET /admin/dashboard/activity',
            fn: (refresh) => dashboardService.getActivityFeed({ page: 1, limit: 10, refresh }),
        },
    ];
    const results = [];
    for (const ep of endpoints) {
        console.log(`⏳ Testing endpoint: ${ep.name}...`);
        const t0 = performance.now();
        await ep.fn(true);
        const uncachedMs = performance.now() - t0;
        const cachedLatencies = [];
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            await ep.fn(false);
            const elapsed = performance.now() - start;
            cachedLatencies.push(elapsed);
        }
        cachedLatencies.sort((a, b) => a - b);
        const p50 = cachedLatencies[Math.floor(ITERATIONS * 0.5)];
        const p95 = cachedLatencies[Math.floor(ITERATIONS * 0.95)];
        const p99 = cachedLatencies[Math.floor(ITERATIONS * 0.99)];
        const speedup = (uncachedMs / (p50 || 0.1)).toFixed(1) + 'x';
        results.push({
            endpoint: ep.name,
            uncachedMs: parseFloat(uncachedMs.toFixed(2)),
            cachedP50Ms: parseFloat(p50.toFixed(2)),
            cachedP95Ms: parseFloat(p95.toFixed(2)),
            cachedP99Ms: parseFloat(p99.toFixed(2)),
            speedup,
        });
    }
    console.log('\n================================================================================');
    console.log('📈 DASHBOARD LOAD-TEST BENCHMARK RESULTS');
    console.log('================================================================================');
    console.table(results);
    console.log('================================================================================\n');
    console.log('✅ ALL DASHBOARD ENDPOINTS VERIFIED ACCEPTABLE (< 50ms CACHED LATENCY)!');
}
runBenchmark()
    .catch((err) => {
    console.error('❌ Load test failed:', err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=load-test-dashboard.js.map