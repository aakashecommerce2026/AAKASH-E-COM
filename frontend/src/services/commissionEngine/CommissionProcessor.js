import HierarchyTraverser from './HierarchyTraverser';
import MembershipCommissionStrategy from './MembershipCommissionStrategy';
import { globalIdempotencyManager } from './IdempotencyManager';

/**
 * CommissionProcessor Module
 * Main orchestrator for the Unilevel MLM Membership Commission Engine.
 * Following Clean Architecture & Separation of Concerns.
 */
export class CommissionProcessor {
  /**
   * Process membership commission distribution for a newly registered member.
   *
   * @param {Object} params
   * @param {Object} params.member - Newly registered member
   * @param {string} params.membershipTxId - Unique transaction ID for membership payment
   * @param {number} params.membershipAmount - Membership package fee paid
   * @param {boolean} params.isPaymentConfirmed - Payment verification flag
   * @param {Array} params.membersList - Full network members list
   * @param {CommissionStrategy} params.strategy - Commission calculation strategy
   * @param {IdempotencyManager} params.idempotencyManager - Idempotency checker
   * @param {boolean} params.simulateFault - Test flag to trigger rollback for testing
   * 
   * @returns {Object} { success, commissionRecords, auditLog, error, rolledBack }
   */
  static processMembershipCommission({
    member,
    membershipTxId,
    membershipAmount = 10000,
    isPaymentConfirmed = true,
    membersList = [],
    strategy = new MembershipCommissionStrategy(),
    idempotencyManager = globalIdempotencyManager,
    simulateFault = false,
    enableDeductions = true,
  }) {
    const timestamp = new Date().toISOString();
    const auditLog = {
      timestamp,
      membershipTxId,
      newMemberId: member?.id,
      newMemberName: member?.name,
      membershipAmount,
      validationsPassed: [],
      traversalStepsCount: 0,
      generatedRecordsCount: 0,
      status: 'INITIATED',
    };

    const pendingRecords = [];

    try {
      // 1. Validation Rule 1: Successful membership transaction
      if (!isPaymentConfirmed) {
        throw new Error(`Validation Error: Membership transaction ${membershipTxId} payment is unconfirmed.`);
      }
      auditLog.validationsPassed.push('PAYMENT_CONFIRMED');

      // 2. Validation Rule 2: Member must exist and have a referrer
      if (!member) {
        throw new Error('Validation Error: Target member data is missing or null.');
      }
      if (!member.sponsorId) {
        auditLog.validationsPassed.push('NO_SPONSOR_ROOT_LEVEL_STOP');
        return {
          success: true,
          commissionRecords: [],
          auditLog: {
            ...auditLog,
            status: 'COMPLETED_NO_SPONSOR',
            message: 'Member has no referrer (Root level member). No commissions generated.',
          },
        };
      }
      auditLog.validationsPassed.push('VALID_REFERRER_EXISTS');

      // 3. Validation Rule 3: Idempotency Check (Prevent duplicates)
      if (idempotencyManager.isProcessed(membershipTxId)) {
        throw new Error(`Idempotency Error: Membership transaction ${membershipTxId} has already been processed.`);
      }
      auditLog.validationsPassed.push('IDEMPOTENCY_CHECK_PASSED');

      // 4. Hierarchy Traversal: Upward traversal max 20 levels
      const uplinePath = HierarchyTraverser.traverseDirectUpline(member, membersList, 20);
      auditLog.traversalStepsCount = uplinePath.length;

      if (uplinePath.length === 0) {
        auditLog.validationsPassed.push('EMPTY_UPLINE_CHAIN');
        return {
          success: true,
          commissionRecords: [],
          auditLog: {
            ...auditLog,
            status: 'COMPLETED_EMPTY_UPLINE',
            message: 'No eligible upline sponsors found in hierarchy tree.',
          },
        };
      }

      // 5. Commission Calculation & Individual Record Generation per eligible upline
      for (const step of uplinePath) {
        const { level, beneficiaryMember, referrerRelationship } = step;
        
        // Calculate percentage rate & amount
        const ratePercent = strategy.getCommissionRate(level);
        const calculatedAmount = strategy.calculateCommission(level, membershipAmount);

        // Simulated Fault Injection for Rollback Testing
        if (simulateFault && level === 3) {
          throw new Error('Simulated Processing Fault at Level 3: Database network write timeout.');
        }

        if (ratePercent > 0 && calculatedAmount > 0) {
          const tdsDeduction = enableDeductions ? (calculatedAmount * 5) / 100 : 0;
          const adminFee = enableDeductions ? (calculatedAmount * 5) / 100 : 0;
          const netPayableAmount = calculatedAmount - tdsDeduction - adminFee;

          const commRecord = {
            id: `MCOMM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            transactionId: `TX-${Date.now()}-${level}`,
            membershipTxId,
            beneficiaryMemberId: beneficiaryMember.id,
            memberName: beneficiaryMember.name, // Beneficiary Member Name
            beneficiaryName: beneficiaryMember.name,
            sourceMemberId: member.id,
            sourceMember: member.name, // Source Member Name
            sourceName: member.name,
            referrerRelationship,
            commissionType: 'Membership',
            category: 'Level',
            level,
            levelTier: strategy.getTierLabel ? strategy.getTierLabel(level) : `Level ${level} (${ratePercent}%)`,
            commissionPercentage: ratePercent,
            membershipAmount,
            amount: calculatedAmount, // Standard UI amount field
            calculatedAmount,
            tdsDeduction,
            adminFee,
            netPayableAmount,
            status: 'Distributed', // Status (Pending/Distributed)
            createdAt: timestamp,
            date: timestamp.slice(0, 10),
            auditInfo: {
              traversalLevel: level,
              referrerRelationship,
              rateApplied: `${ratePercent}%`,
              tdsRate: enableDeductions ? '5% (Sec 194H)' : '0% (Disabled)',
              adminFeeRate: enableDeductions ? '5%' : '0% (Disabled)',
              formula: enableDeductions 
                ? `Gross (${calculatedAmount}) - 5% TDS (${tdsDeduction}) - 5% Admin (${adminFee}) = Net (${netPayableAmount})`
                : `Gross (${calculatedAmount}) - 0% Deductions = Net (${netPayableAmount})`,
              idempotencyHash: `${membershipTxId}_L${level}_B${beneficiaryMember.id}`,
              rulesVersion: '1.0.0-Unilevel-20L',
              validatedAt: timestamp,
            },
          };

          pendingRecords.push(commRecord);
        }
      }

      // 6. Finalize & Mark Idempotency
      idempotencyManager.markProcessed(membershipTxId);
      auditLog.generatedRecordsCount = pendingRecords.length;
      auditLog.status = 'COMPLETED_SUCCESSFULLY';

      return {
        success: true,
        commissionRecords: pendingRecords,
        auditLog,
        error: null,
      };
    } catch (err) {
      // 7. Atomic Rollback: If failure occurs during processing, roll back all generated records
      auditLog.status = 'FAILED_ROLLED_BACK';
      auditLog.failureReason = err.message;

      return {
        success: false,
        commissionRecords: [], // Rollback: return 0 records
        rolledBack: true,
        auditLog,
        error: err.message,
      };
    }
  }
}

export default CommissionProcessor;
