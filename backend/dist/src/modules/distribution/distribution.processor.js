"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DistributionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const distribution_service_1 = require("./distribution.service");
let DistributionProcessor = DistributionProcessor_1 = class DistributionProcessor {
    distributionService;
    logger = new common_1.Logger(DistributionProcessor_1.name);
    constructor(distributionService) {
        this.distributionService = distributionService;
    }
    async handleDistributionBatch(job) {
        this.logger.log(`Processing distribution batch job #${job.id} for Batch ID '${job.data.batchId}' in background queue...`);
        try {
            const result = await this.distributionService.executeBatchProcessing(job.data.batchId, job.data, job.data.actorId, job.data.actorRole);
            this.logger.log(`✅ Distribution batch job #${job.id} completed successfully for Batch '${result.batchNo}' (${result.totalMembers} members, Net: ₹${result.totalNetAmount}).`);
            return result;
        }
        catch (error) {
            this.logger.error(`❌ Distribution batch job #${job.id} failed for Batch ID '${job.data.batchId}': ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.DistributionProcessor = DistributionProcessor;
__decorate([
    (0, bull_1.Process)('process-batch'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DistributionProcessor.prototype, "handleDistributionBatch", null);
exports.DistributionProcessor = DistributionProcessor = DistributionProcessor_1 = __decorate([
    (0, bull_1.Processor)('distribution-queue'),
    __metadata("design:paramtypes", [distribution_service_1.DistributionService])
], DistributionProcessor);
//# sourceMappingURL=distribution.processor.js.map