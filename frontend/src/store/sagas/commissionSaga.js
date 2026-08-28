import { call, put, all, takeLatest, select } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { commissionApi, settingsApi } from '../../services/api';
import { CommissionProcessor } from '../../services/commissionEngine/CommissionProcessor';
import { MembershipCommissionStrategy } from '../../services/commissionEngine/MembershipCommissionStrategy';

// Worker Saga fetching live ledgers from NestJS backend
function* fetchCommissions() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      yield put(actions.fetchCommissionsSuccess([]));
      return;
    }

    const [memResponse, repResponse] = yield all([
      call(commissionApi.getMembershipLedger, { limit: 100 }),
      call(commissionApi.getRepurchaseLedger, { limit: 100 }),
    ]);

    const memList = Array.isArray(memResponse) ? memResponse : memResponse?.data || [];
    const repList = Array.isArray(repResponse) ? repResponse : repResponse?.data || [];

    const mappedMemCommissions = memList.map((m) => ({
      id: m.id,
      transactionId: m.id,
      membershipTxId: `MTX-${m.sourceMemberId.slice(0, 6)}`,
      memberId: m.beneficiaryMemberId,
      memberName: m.beneficiaryMember?.name || 'Beneficiary Member',
      beneficiaryName: m.beneficiaryMember?.name || 'Beneficiary Member',
      sourceMember: m.sourceMember?.name || 'Source Member',
      sourceName: m.sourceMember?.name || 'Source Member',
      amount: Number(m.amount),
      calculatedAmount: Number(m.amount),
      membershipAmount: 10000.0,
      commissionPercentage: Number(m.percentage),
      referrerRelationship: `Level ${m.level} Sponsor`,
      commissionType: 'Membership',
      category: 'Level',
      level: m.level,
      levelTier: `Level ${m.level} (${m.percentage}%)`,
      status: m.status === 'DISBURSED' ? 'Paid' : m.status === 'PENDING' ? 'Pending' : 'Hold',
      date: m.createdAt ? m.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: m.createdAt,
      auditInfo: {
        traversalLevel: m.level,
        referrerRelationship: `Level ${m.level} Sponsor`,
        rateApplied: `${m.percentage}%`,
        formula: `Joining Fee * ${m.percentage}% = ${m.amount}`,
        idempotencyHash: `LEDGER_${m.id}`,
        rulesVersion: '1.0.0-Unilevel-20L',
        validatedAt: m.createdAt,
      },
    }));

    const mappedRepCommissions = repList.map((r) => ({
      id: r.id,
      transactionId: r.id,
      repurchaseTxId: r.repurchaseEntry?.transactionRef || r.repurchaseEntryId,
      memberId: r.beneficiaryMemberId,
      memberName: r.beneficiaryMember?.name || 'Beneficiary Member',
      beneficiaryName: r.beneficiaryMember?.name || 'Beneficiary Member',
      sourceMemberId: r.sourceMemberId,
      sourceMember: r.sourceMember?.name || 'Purchaser',
      sourceName: r.sourceMember?.name || 'Purchaser',
      amount: Number(r.amount),
      calculatedAmount: Number(r.amount),
      repurchaseAmount: Number(r.repurchaseEntry?.amount || 0),
      bvPoints: Math.round(Number(r.repurchaseEntry?.amount || 0) * 0.025 * 100) / 100,
      commissionPercentage: Number(r.percentage),
      referrerRelationship: `Level ${r.level} Upline`,
      commissionType: 'Repurchase',
      category: 'Repurchase',
      level: r.level,
      levelTier: `Level ${r.level} Repurchase (${r.percentage}%)`,
      status: r.status === 'DISBURSED' ? 'Paid' : r.status === 'PENDING' ? 'Pending' : 'Hold',
      date: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: r.createdAt,
      auditInfo: {
        traversalLevel: r.level,
        referrerRelationship: `Level ${r.level} Upline`,
        rateApplied: `${r.percentage}%`,
        formula: `Repurchase (${r.repurchaseEntry?.amount || 0}) * ${r.percentage}% = ${r.amount}`,
        idempotencyHash: `RLEDGER_${r.id}`,
        rulesVersion: '1.0.0-Unilevel-Repurchase-20L',
        validatedAt: r.createdAt,
      },
    }));

    const allCommissions = [...mappedMemCommissions, ...mappedRepCommissions];

    yield put(actions.fetchCommissionsSuccess(allCommissions));
  } catch (err) {
    yield put(actions.fetchCommissionsFailure(err.message || 'Failed to fetch financial commissions ledger'));
  }
}

// Saga for generating commissions using CommissionProcessor
function* generateMembershipCommissionsSaga(action) {
  try {
    const { member, membershipTxId, membershipAmount, isPaymentConfirmed, simulateFault } = action.payload;

    if (member?.id && typeof member.id === 'string' && member.id.includes('-')) {
      try {
        yield call(commissionApi.triggerMembershipCommission, member.id, { packageAmount: membershipAmount });
      } catch {
        // Fallback to client processor if member id is non-UUID simulation
      }
    }

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

function* fetchCommissionConfigsSaga() {
  try {
    const [memConfigRes, repConfigRes] = yield all([
      call(commissionApi.getMembershipConfig),
      call(commissionApi.getRepurchaseConfig),
    ]);

    const memList = Array.isArray(memConfigRes) ? memConfigRes : memConfigRes?.data || [];
    const repList = Array.isArray(repConfigRes) ? repConfigRes : repConfigRes?.data || [];

    const membershipRules = {};
    let version = 1;
    memList.forEach((c) => {
      if (c.level) membershipRules[c.level] = Number(c.percentage);
      if (c.version) version = Math.max(version, c.version);
    });

    const repurchaseRules = {};
    repList.forEach((c) => {
      if (c.level) repurchaseRules[c.level] = Number(c.percentage);
    });

    yield put(
      actions.fetchCommissionConfigsSuccess({
        membershipRules: Object.keys(membershipRules).length > 0 ? membershipRules : undefined,
        repurchaseRules: Object.keys(repurchaseRules).length > 0 ? repurchaseRules : undefined,
        version,
      })
    );
  } catch (err) {
    yield put(actions.fetchCommissionConfigsFailure(err.message || 'Failed to fetch commission configurations'));
  }
}

function* saveMembershipConfigSaga(action) {
  try {
    const { version, isActive, rates } = action.payload;
    const response = yield call(commissionApi.saveMembershipConfig, {
      version: version || 1,
      isActive: isActive !== false,
      rates,
    });

    const list = Array.isArray(response) ? response : response?.data || [];
    const updatedRules = {};
    let newVersion = version;
    list.forEach((c) => {
      if (c.level) updatedRules[c.level] = Number(c.percentage);
      if (c.version) newVersion = c.version;
    });

    if (Object.keys(updatedRules).length === 0) {
      rates.forEach((r) => {
        updatedRules[r.level] = Number(r.percentage);
      });
    }

    yield put(
      actions.saveMembershipConfigSuccess({
        rules: updatedRules,
        version: newVersion,
      })
    );
  } catch (err) {
    yield put(actions.saveMembershipConfigFailure(err.message || 'Failed to save membership commission configuration'));
  }
}

function* saveRepurchaseConfigSaga(action) {
  try {
    const { rates } = action.payload;
    const response = yield call(commissionApi.saveRepurchaseConfig, { rates });

    const list = Array.isArray(response) ? response : response?.data || [];
    const updatedRules = {};
    list.forEach((c) => {
      if (c.level) updatedRules[c.level] = Number(c.percentage);
    });

    if (Object.keys(updatedRules).length === 0) {
      rates.forEach((r) => {
        updatedRules[r.level] = Number(r.percentage);
      });
    }

    yield put(actions.saveRepurchaseConfigSuccess(updatedRules));
  } catch (err) {
    yield put(actions.saveRepurchaseConfigFailure(err.message || 'Failed to save repurchase commission configuration'));
  }
}

function* fetchTdsStatusSaga() {
  try {
    const res = yield call(settingsApi.getTdsStatus);
    const enabled = res?.enabled !== false;
    yield put(actions.fetchTdsStatusSuccess(enabled));
  } catch (err) {
    yield put(actions.fetchTdsStatusFailure(err.message || 'Failed to fetch TDS status'));
  }
}

function* saveTdsStatusSaga(action) {
  try {
    const enabled = Boolean(action.payload);
    const res = yield call(settingsApi.updateTdsStatus, { enabled });
    const isEnabled = res?.enabled !== false;
    yield put(actions.saveTdsStatusSuccess(isEnabled));
    yield put(actions.toggleCommissionDeductions(isEnabled));
  } catch (err) {
    yield put(actions.saveTdsStatusFailure(err.message || 'Failed to update TDS status'));
  }
}

// Watcher Saga
export default function* commissionSaga() {
  yield takeLatest(types.FETCH_COMMISSIONS_REQUEST, fetchCommissions);
  yield takeLatest(types.GENERATE_MEMBERSHIP_COMMISSIONS_REQUEST, generateMembershipCommissionsSaga);
  yield takeLatest(types.FETCH_COMMISSION_CONFIGS_REQUEST, fetchCommissionConfigsSaga);
  yield takeLatest(types.SAVE_MEMBERSHIP_CONFIG_REQUEST, saveMembershipConfigSaga);
  yield takeLatest(types.SAVE_REPURCHASE_CONFIG_REQUEST, saveRepurchaseConfigSaga);
  yield takeLatest(types.FETCH_TDS_STATUS_REQUEST, fetchTdsStatusSaga);
  yield takeLatest(types.SAVE_TDS_STATUS_REQUEST, saveTdsStatusSaga);
}
