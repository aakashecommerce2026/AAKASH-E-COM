import { put, delay, takeLatest, select } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { CommissionProcessor } from '../../services/commissionEngine/CommissionProcessor';
import { MembershipCommissionStrategy } from '../../services/commissionEngine/MembershipCommissionStrategy';

// Initial Mock Commission Dataset with Audit Trail Metadata
const mockCommissionsData = [
  // Level Earnings Tiers
  { 
    id: 'COMM-101', 
    transactionId: 'TX-20260601-1',
    membershipTxId: 'MTX-801',
    memberId: 1, 
    memberName: 'Arun Kumar', 
    beneficiaryName: 'Arun Kumar',
    sourceMember: 'Priya Chandran', 
    sourceName: 'Priya Chandran',
    amount: 1000.00, 
    calculatedAmount: 1000.00,
    membershipAmount: 10000.00,
    commissionPercentage: 10.0,
    referrerRelationship: 'Level 1 Direct Sponsor',
    commissionType: 'Membership', 
    category: 'Level', 
    level: 1,
    levelTier: 'Level 1 Direct (10%)', 
    status: 'Distributed', 
    date: '2026-06-01',
    createdAt: '2026-06-01T10:00:00.000Z',
    auditInfo: {
      traversalLevel: 1,
      referrerRelationship: 'Level 1 Direct Sponsor',
      rateApplied: '10%',
      formula: '(10000 * 10%) = 1000',
      idempotencyHash: 'MTX-801_L1_B1',
      rulesVersion: '1.0.0-Unilevel-20L',
      validatedAt: '2026-06-01T10:00:00.000Z',
    }
  },
  { 
    id: 'COMM-102', 
    transactionId: 'TX-20260605-1',
    membershipTxId: 'MTX-802',
    memberId: 2, 
    memberName: 'Priya Chandran', 
    beneficiaryName: 'Priya Chandran',
    sourceMember: 'Vignesh Balaji', 
    sourceName: 'Vignesh Balaji',
    amount: 1000.00, 
    calculatedAmount: 1000.00,
    membershipAmount: 10000.00,
    commissionPercentage: 10.0,
    referrerRelationship: 'Level 1 Direct Sponsor',
    commissionType: 'Membership', 
    category: 'Level', 
    level: 1,
    levelTier: 'Level 1 Direct (10%)', 
    status: 'Pending', 
    date: '2026-06-05',
    createdAt: '2026-06-05T11:30:00.000Z',
    auditInfo: {
      traversalLevel: 1,
      referrerRelationship: 'Level 1 Direct Sponsor',
      rateApplied: '10%',
      formula: '(10000 * 10%) = 1000',
      idempotencyHash: 'MTX-802_L1_B2',
      rulesVersion: '1.0.0-Unilevel-20L',
      validatedAt: '2026-06-05T11:30:00.000Z',
    }
  },
  { 
    id: 'COMM-103', 
    transactionId: 'TX-20260608-2',
    membershipTxId: 'MTX-802',
    memberId: 1, 
    memberName: 'Arun Kumar', 
    beneficiaryName: 'Arun Kumar',
    sourceMember: 'Vignesh Balaji', 
    sourceName: 'Vignesh Balaji',
    amount: 500.00, 
    calculatedAmount: 500.00,
    membershipAmount: 10000.00,
    commissionPercentage: 5.0,
    referrerRelationship: 'Level 2 Indirect Sponsor',
    commissionType: 'Membership', 
    category: 'Level', 
    level: 2,
    levelTier: 'Level 2 Indirect (5%)', 
    status: 'Distributed', 
    date: '2026-06-08',
    createdAt: '2026-06-08T14:15:00.000Z',
    auditInfo: {
      traversalLevel: 2,
      referrerRelationship: 'Level 2 Indirect Sponsor',
      rateApplied: '5%',
      formula: '(10000 * 5%) = 500',
      idempotencyHash: 'MTX-802_L2_B1',
      rulesVersion: '1.0.0-Unilevel-20L',
      validatedAt: '2026-06-08T14:15:00.000Z',
    }
  },
  { 
    id: 'COMM-104', 
    transactionId: 'TX-20260615-3',
    membershipTxId: 'MTX-803',
    memberId: 1, 
    memberName: 'Arun Kumar', 
    beneficiaryName: 'Arun Kumar',
    sourceMember: 'Deepa Sundar', 
    sourceName: 'Deepa Sundar',
    amount: 250.00, 
    calculatedAmount: 250.00,
    membershipAmount: 10000.00,
    commissionPercentage: 2.5,
    referrerRelationship: 'Level 3 Direct Upline',
    commissionType: 'Membership', 
    category: 'Level', 
    level: 3,
    levelTier: 'Level 3 Tier 3-6 (2.5%)', 
    status: 'Distributed', 
    date: '2026-06-15',
    createdAt: '2026-06-15T09:20:00.000Z',
    auditInfo: {
      traversalLevel: 3,
      referrerRelationship: 'Level 3 Direct Upline',
      rateApplied: '2.5%',
      formula: '(10000 * 2.5%) = 250',
      idempotencyHash: 'MTX-803_L3_B1',
      rulesVersion: '1.0.0-Unilevel-20L',
      validatedAt: '2026-06-15T09:20:00.000Z',
    }
  },

  // Downline Repurchase Commission Records
  { 
    id: 'RCOMM-201-L1', 
    transactionId: 'TX-REP-20260715-L1',
    repurchaseTxId: 'REF-20260715-02',
    memberId: 1, 
    memberName: 'Arun Kumar', 
    beneficiaryName: 'Arun Kumar',
    sourceMemberId: 2,
    sourceMember: 'Priya Chandran', 
    sourceName: 'Priya Chandran',
    amount: 63.75, 
    calculatedAmount: 63.75,
    repurchaseAmount: 4250.00,
    bvPoints: 106.25,
    commissionPercentage: 1.50,
    referrerRelationship: 'Level 1 Direct Sponsor',
    commissionType: 'Repurchase', 
    category: 'Repurchase', 
    level: 1,
    levelTier: 'Level 1 Repurchase (1.50%)', 
    status: 'Paid', 
    date: '2026-07-15',
    createdAt: '2026-07-15T10:00:00.000Z',
    auditInfo: {
      traversalLevel: 1,
      referrerRelationship: 'Level 1 Direct Sponsor',
      rateApplied: '1.5%',
      formula: 'Repurchase (4250.00) * 1.5% = 63.75',
      idempotencyHash: 'REF-20260715-02_L1_B1',
      rulesVersion: '1.0.0-Unilevel-Repurchase-20L',
      validatedAt: '2026-07-15T10:00:00.000Z',
    }
  },
  { 
    id: 'RCOMM-205-L1', 
    transactionId: 'TX-REP-20260705-L1',
    repurchaseTxId: 'REF-20260705-05',
    memberId: 2, 
    memberName: 'Priya Chandran', 
    beneficiaryName: 'Priya Chandran',
    sourceMemberId: 5,
    sourceMember: 'Vignesh Balaji', 
    sourceName: 'Vignesh Balaji',
    amount: 120.00, 
    calculatedAmount: 120.00,
    repurchaseAmount: 8000.00,
    bvPoints: 200.00,
    commissionPercentage: 1.50,
    referrerRelationship: 'Level 1 Direct Sponsor',
    commissionType: 'Repurchase', 
    category: 'Repurchase', 
    level: 1,
    levelTier: 'Level 1 Repurchase (1.50%)', 
    status: 'Paid', 
    date: '2026-07-05',
    createdAt: '2026-07-05T14:00:00.000Z',
    auditInfo: {
      traversalLevel: 1,
      referrerRelationship: 'Level 1 Direct Sponsor',
      rateApplied: '1.5%',
      formula: 'Repurchase (8000.00) * 1.5% = 120.00',
      idempotencyHash: 'REF-20260705-05_L1_B2',
      rulesVersion: '1.0.0-Unilevel-Repurchase-20L',
      validatedAt: '2026-07-05T14:00:00.000Z',
    }
  },
  { 
    id: 'RCOMM-205-L2', 
    transactionId: 'TX-REP-20260705-L2',
    repurchaseTxId: 'REF-20260705-05',
    memberId: 1, 
    memberName: 'Arun Kumar', 
    beneficiaryName: 'Arun Kumar',
    sourceMemberId: 5,
    sourceMember: 'Vignesh Balaji', 
    sourceName: 'Vignesh Balaji',
    amount: 60.00, 
    calculatedAmount: 60.00,
    repurchaseAmount: 8000.00,
    bvPoints: 200.00,
    commissionPercentage: 0.75,
    referrerRelationship: 'Level 2 Indirect Sponsor',
    commissionType: 'Repurchase', 
    category: 'Repurchase', 
    level: 2,
    levelTier: 'Level 2 Repurchase (0.75%)', 
    status: 'Paid', 
    date: '2026-07-05',
    createdAt: '2026-07-05T14:00:00.000Z',
    auditInfo: {
      traversalLevel: 2,
      referrerRelationship: 'Level 2 Indirect Sponsor',
      rateApplied: '0.75%',
      formula: 'Repurchase (8000.00) * 0.75% = 60.00',
      idempotencyHash: 'REF-20260705-05_L2_B1',
      rulesVersion: '1.0.0-Unilevel-Repurchase-20L',
      validatedAt: '2026-07-05T14:00:00.000Z',
    }
  },
];

// Worker Saga with Redux-Saga DB Latency Simulation
function* fetchCommissions() {
  try {
    yield delay(500); // 500ms DB latency
    yield put(actions.fetchCommissionsSuccess(mockCommissionsData));
  } catch (error) {
    yield put(actions.fetchCommissionsFailure(error.message || 'Failed to fetch financial commissions ledger'));
  }
}

// Saga for generating commissions using CommissionProcessor
function* generateMembershipCommissionsSaga(action) {
  try {
    yield delay(400); // DB execution simulation latency

    const { member, membershipTxId, membershipAmount, isPaymentConfirmed, simulateFault } = action.payload;

    const membersState = yield select((state) => state.membership.members || []);
    const strategyRules = yield select((state) => state.commission.strategyRules);
    const enableDeductions = yield select((state) => state.commission.enableDeductions);

    const customStrategy = new MembershipCommissionStrategy(strategyRules);

    const result = CommissionProcessor.processMembershipCommission({
      member,
      membershipTxId,
      membershipAmount,
      isPaymentConfirmed,
      membersList: membersState,
      strategy: customStrategy,
      simulateFault: !!simulateFault,
      enableDeductions: enableDeductions !== false,
    });

    if (result.success) {
      yield put(actions.generateMembershipCommissionsSuccess({
        commissionRecords: result.commissionRecords,
        auditLog: result.auditLog,
        membershipTxId,
      }));
    } else {
      yield put(actions.generateMembershipCommissionsFailure(result.error || 'Commission engine processing failed. All records rolled back.'));
    }
  } catch (err) {
    yield put(actions.generateMembershipCommissionsFailure(err.message || 'Commission Engine Execution Exception'));
  }
}

// Watcher Saga
export default function* commissionSaga() {
  yield takeLatest(types.FETCH_COMMISSIONS_REQUEST, fetchCommissions);
  yield takeLatest(types.GENERATE_MEMBERSHIP_COMMISSIONS_REQUEST, generateMembershipCommissionsSaga);
}
