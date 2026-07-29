import { HierarchyTraverser } from './HierarchyTraverser';
import { globalIdempotencyManager } from './IdempotencyManager';
import { RepurchaseCommissionStrategy } from './RepurchaseCommissionStrategy';

/**
 * RepurchaseCommissionProcessor Module
 * Orchestrates the complete 20-level Unilevel Repurchase Commission calculation,
 * ledger creation, audit trail generation, and transactional integrity.
 */
export class RepurchaseCommissionProcessor {
  /**
   * Processes repurchase commission generation for a given repurchase transaction.
   *
   * @param {Object} params
   * @param {Object} params.member - Purchasing member object
   * @param {string} params.repurchaseTxId - Unique repurchase transaction reference ID
   * @param {number} params.repurchaseAmount - Amount of repurchase purchase (must be > 0)
   * @param {boolean} [params.isPaymentConfirmed=true] - Whether payment is approved
   * @param {Array} [params.membersList=[]] - Complete member hierarchy list
   * @param {RepurchaseCommissionStrategy} [params.strategy] - Strategy rates
   * @param {IdempotencyManager} [params.idempotencyManager] - Idempotency tracker
   * @param {boolean} [params.simulateFault=false] - Simulated fault injection trigger
   * @param {boolean} [params.enableDeductions=true] - Dynamic Admin toggle for 5% TDS + 5% Admin Charge
   * @returns {Object} { success, commissionRecords, ledgerEntries, auditLog, error }
   */
  static processRepurchaseCommission({
    member,
    repurchaseTxId,
    repurchaseAmount = 0,
    isPaymentConfirmed = true,
    membersList = [],
    strategy = new RepurchaseCommissionStrategy(),
    idempotencyManager = globalIdempotencyManager,
    simulateFault = false,
    enableDeductions = true,
  }) {
    const timestamp = new Date().toISOString();
    const auditLog = {
      timestamp,
      repurchaseTxId,
      purchaserMemberId: member?.id,
      purchaserMemberCode: member?.referralCode || (member?.id ? `MEM-${member.id}` : null),
      purchaserName: member?.name,
      repurchaseAmount,
      validationsPassed: [],
      traversalStepsCount: 0,
      generatedRecordsCount: 0,
      totalCommissionDistributed: 0,
      status: 'INITIATED',
      auditDetails: [],
    };

    const commissionRecords = [];
    const ledgerEntries = [];

    try {
      // 1. Validation Rule 1: Repurchase Amount must be > 0
      const parsedAmount = parseFloat(repurchaseAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error(`Validation Error: Repurchase amount must be greater than zero. Received: ${repurchaseAmount}`);
      }
      auditLog.validationsPassed.push('REPURCHASE_AMOUNT_VALID');

      // 2. Validation Rule 2: Transaction Payment Confirmation
      if (!isPaymentConfirmed) {
        throw new Error(`Validation Error: Repurchase transaction ${repurchaseTxId} payment is unconfirmed/unapproved.`);
      }
      auditLog.validationsPassed.push('PAYMENT_CONFIRMED');

      // 3. Validation Rule 3: Purchasing Member Existence & Sponsor Check
      if (!member) {
        throw new Error('Validation Error: Purchasing member data is missing or null.');
      }
      if (!member.sponsorId) {
        auditLog.validationsPassed.push('NO_SPONSOR_ROOT_LEVEL_STOP');
        return {
          success: true,
          commissionRecords: [],
          ledgerEntries: [],
          auditLog: {
            ...auditLog,
            status: 'COMPLETED_NO_SPONSOR',
            message: 'Purchasing member has no sponsor (Root member). No upline repurchase commissions generated.',
          },
        };
      }
      auditLog.validationsPassed.push('VALID_MEMBER_SPONSOR_EXISTS');

      // 4. Validation Rule 4: Idempotency Check (Prevent duplicate calculations)
      if (idempotencyManager.isProcessed(`REP_${repurchaseTxId}`)) {
        throw new Error(`Idempotency Error: Repurchase transaction ${repurchaseTxId} has already generated commissions.`);
      }
      auditLog.validationsPassed.push('IDEMPOTENCY_CHECK_PASSED');

      // 5. Hierarchy Traversal: Upward traversal along sponsor chain max 20 levels
      const uplinePath = HierarchyTraverser.traverseDirectUpline(member, membersList, 20);
      auditLog.traversalStepsCount = uplinePath.length;

      if (uplinePath.length === 0) {
        auditLog.validationsPassed.push('EMPTY_UPLINE_CHAIN');
        return {
          success: true,
          commissionRecords: [],
          ledgerEntries: [],
          auditLog: {
            ...auditLog,
            status: 'COMPLETED_EMPTY_UPLINE',
            message: 'No eligible upline sponsors found in network tree.',
          },
        };
      }
      auditLog.validationsPassed.push('HIERARCHY_TRAVERSED');

      let runningDistributedTotal = 0;

      // 6. Calculate Commission & Ledger Entry per eligible upline
      for (const step of uplinePath) {
        const { level, beneficiaryMember, referrerRelationship } = step;

        // Rate percentage & gross commission amount calculation
        const ratePercent = strategy.getCommissionRate(level);
        const calculatedAmount = strategy.calculateCommission(level, parsedAmount);

        // Simulated Fault Injection for Rollback Testing
        if (simulateFault && level === 3) {
          throw new Error('Simulated Database Fault at Level 3: Network deadlock while persisting repurchase ledger.');
        }

        if (ratePercent > 0 && calculatedAmount > 0) {
          const commId = `RCOMM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}-L${level}`;
          const ledgerId = `LEDGER-REP-${Date.now().toString(36).toUpperCase()}-L${level}`;

          const tdsDeduction = enableDeductions ? Math.round(((calculatedAmount * 5) / 100) * 100) / 100 : 0;
          const adminFee = enableDeductions ? Math.round(((calculatedAmount * 5) / 100) * 100) / 100 : 0;
          const netPayableAmount = Math.round((calculatedAmount - tdsDeduction - adminFee) * 100) / 100;

          // Repurchase Commission Record
          const commRecord = {
            id: commId,
            repurchaseTxId,
            transactionId: `TX-REP-${Date.now()}-L${level}`,
            beneficiaryMemberId: beneficiaryMember.id,
            beneficiaryMemberCode: beneficiaryMember.referralCode || `MEM-${beneficiaryMember.id}`,
            memberName: beneficiaryMember.name,
            beneficiaryName: beneficiaryMember.name,
            sourceMemberId: member.id,
            sourceMemberCode: member.referralCode || `MEM-${member.id}`,
            sourceMember: member.name,
            sourceName: member.name,
            referrerRelationship,
            commissionType: 'Repurchase',
            category: 'Repurchase',
            level,
            levelTier: strategy.getTierLabel ? strategy.getTierLabel(level) : `Level ${level} (${ratePercent}%)`,
            commissionPercentage: ratePercent,
            repurchaseAmount: parsedAmount,
            amount: calculatedAmount,
            calculatedAmount,
            tdsDeduction,
            adminFee,
            netPayableAmount,
            status: 'Distributed',
            createdAt: timestamp,
            date: timestamp.slice(0, 10),
            auditInfo: {
              traversalLevel: level,
              referrerRelationship,
              rateApplied: `${ratePercent}%`,
              tdsRate: enableDeductions ? '5% (Sec 194H)' : '0% (Disabled)',
              adminFeeRate: enableDeductions ? '5%' : '0% (Disabled)',
              formula: enableDeductions
                ? `Repurchase (${parsedAmount}) * ${ratePercent}% = Gross (${calculatedAmount}) - 5% TDS (${tdsDeduction}) - 5% Admin (${adminFee}) = Net (${netPayableAmount})`
                : `Repurchase (${parsedAmount}) * ${ratePercent}% = Gross (${calculatedAmount}) - 0% Deductions = Net (${netPayableAmount})`,
              idempotencyHash: `REP_${repurchaseTxId}_L${level}_B${beneficiaryMember.id}`,
              rulesVersion: '1.0.0-Unilevel-Repurchase-20L',
              validatedAt: timestamp,
            },
          };

          // Immutable Financial Ledger Entry
          const ledgerEntry = {
            id: ledgerId,
            commissionId: commId,
            repurchaseTxId,
            beneficiaryMemberId: beneficiaryMember.id,
            beneficiaryMemberCode: beneficiaryMember.referralCode || `MEM-${beneficiaryMember.id}`,
            beneficiaryName: beneficiaryMember.name,
            sourceMemberId: member.id,
            sourceMemberCode: member.referralCode || `MEM-${member.id}`,
            sourceName: member.name,
            commissionType: 'Repurchase Level Override',
            level,
            grossAmount: calculatedAmount,
            tdsDeduction,
            adminFee,
            netAmount: netPayableAmount,
            balanceEffect: '+CREDIT',
            status: 'POSTED',
            timestamp,
          };

          commissionRecords.push(commRecord);
          ledgerEntries.push(ledgerEntry);
          runningDistributedTotal += calculatedAmount;

          auditLog.auditDetails.push({
            level,
            beneficiary: `${beneficiaryMember.name} (${beneficiaryMember.referralCode || `MEM-${beneficiaryMember.id}`})`,
            ratePercent: `${ratePercent}%`,
            gross: calculatedAmount,
            net: netPayableAmount,
          });
        }
      }

      // Mark Idempotency
      idempotencyManager.markProcessed(`REP_${repurchaseTxId}`);
      auditLog.validationsPassed.push('IDEMPOTENCY_LOCKED');

      auditLog.generatedRecordsCount = commissionRecords.length;
      auditLog.totalCommissionDistributed = Math.round(runningDistributedTotal * 100) / 100;
      auditLog.status = 'COMPLETED';

      return {
        success: true,
        commissionRecords,
        ledgerEntries,
        auditLog,
      };
    } catch (err) {
      // Transaction Rollback logic: wipe draft records on error
      return {
        success: false,
        commissionRecords: [],
        ledgerEntries: [],
        auditLog: {
          ...auditLog,
          status: 'FAILED_ROLLED_BACK',
          errorMessage: err.message,
          failureTimestamp: new Date().toISOString(),
        },
        error: err.message,
      };
    }
  }
}
