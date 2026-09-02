import { call, put, all, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { distributionApi } from '../../services/api';

function* fetchPayouts() {
  try {
    const storedAuth = localStorage.getItem('auth');
    if (!storedAuth) {
      yield put(actions.fetchPayoutsSuccess([]));
      return;
    }

    const authData = JSON.parse(storedAuth);
    const userRole = authData?.user?.memberRole || authData?.user?.role;
    if (userRole === 'MEMBER' || userRole === 'Member') {
      yield put(actions.fetchPayoutsSuccess([]));
      return;
    }

    // Parallel fetch of pending ledgers AND batch history in a single round-trip
    const [pendingResponse, historyResponse] = yield all([
      call(distributionApi.getPending, { limit: 100 }),
      call(distributionApi.getHistory, { limit: 20 }),
    ]);

    const pendingData = Array.isArray(pendingResponse)
      ? pendingResponse
      : pendingResponse?.data || pendingResponse?.items || [];

    const pendingPayouts = pendingData.map((item, idx) => ({
      id: item.member?.id || `PAY-${idx + 1001}`,
      memberId: item.member?.id || item.memberId,
      memberName: item.member?.name || 'Member',
      memberCode: item.member?.memberCode || 'AK100',
      type:
        item.membershipPendingCount > 0 && item.repurchasePendingCount > 0
          ? 'Combined Commission'
          : item.membershipPendingCount > 0
          ? 'Direct Referral Commission'
          : 'Repurchase Commission',
      grossAmount: item.grossAmount || 0,
      tdsDeduction: item.tdsAmount || 0,
      adminFee: item.adminFee || 0,
      netPayable: item.netAmount || 0,
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
      processedDate: null,
      transactionRef: 'PENDING_APPROVAL',
      bankAccount: item.member?.bankDetails?.accountNo
        ? `****${item.member.bankDetails.accountNo.slice(-4)}`
        : 'UPI / Direct Bank',
    }));

    const historyBatches = Array.isArray(historyResponse)
      ? historyResponse
      : historyResponse?.data || [];

    const processedPayouts = [];
    for (const batch of historyBatches) {
      const records = batch?.records || [];
      for (const r of records) {
        processedPayouts.push({
          id: r.id || `${batch.id}-${r.memberId}`,
          memberId: r.memberId || r.member?.id,
          memberName: r.member?.name || 'Member',
          memberCode: r.member?.memberCode || 'AK100',
          type:
            r.commissionType === 'COMBINED'
              ? 'Combined Commission'
              : r.commissionType === 'MEMBERSHIP'
              ? 'Direct Referral Commission'
              : 'Repurchase Commission',
          grossAmount: r.grossAmount || 0,
          tdsDeduction: r.tdsAmount || 0,
          adminFee: r.adminFee || 0,
          netPayable: r.netAmount || 0,
          status: 'Processed',
          createdDate: batch.createdAt
            ? new Date(batch.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          processedDate: batch.completedAt
            ? new Date(batch.completedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          transactionRef: batch.batchNo,
          bankAccount: r.member?.bankDetails?.accountNo
            ? `****${r.member.bankDetails.accountNo.slice(-4)}`
            : 'UPI / Direct Bank',
        });
      }
    }

    const allPayouts = [...pendingPayouts, ...processedPayouts];
    yield put(actions.fetchPayoutsSuccess(allPayouts));
  } catch (err) {
    yield put(actions.fetchPayoutsFailure(err.message || 'Failed to fetch payout records'));
  }
}

function* processPayout(action) {
  try {
    const payload = action.payload;
    const memberId = typeof payload === 'object' ? (payload.memberId || payload.id) : payload;

    const batchResponse = yield call(distributionApi.processBatch, {
      memberIds: [memberId],
      remarks: 'Individual Payout Release from Admin Console',
    });

    const today = new Date().toISOString().split('T')[0];
    const updated = {
      id: memberId,
      memberId: memberId,
      status: 'Processed',
      processedDate: today,
      transactionRef: batchResponse?.batchNo || `BATCH-NEFT${Math.floor(100000 + Math.random() * 900000)}`,
    };

    yield put(actions.processPayoutSuccess(updated));
    yield put(actions.fetchPayoutsRequest());
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error.message || 'Failed to process individual payout';
    yield put(actions.processPayoutFailure(errorMessage));
  }
}

function* batchProcessPayouts(action) {
  try {
    const payload = action.payload;
    const memberIds = Array.isArray(payload)
      ? payload.map((item) => (typeof item === 'object' ? (item.memberId || item.id) : item))
      : [];

    const batchResponse = yield call(distributionApi.processBatch, {
      memberIds,
      remarks: 'Batch Payout Release from Admin Console',
    });

    const today = new Date().toISOString().split('T')[0];
    const results = memberIds.map((id) => ({
      id,
      memberId: id,
      status: 'Processed',
      processedDate: today,
      transactionRef: batchResponse?.batchNo || `BATCH-NEFT${Math.floor(100000 + Math.random() * 900000)}`,
    }));

    yield put(actions.batchProcessPayoutsSuccess(results));
    yield put(actions.fetchPayoutsRequest());
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error.message || 'Failed to execute batch payout release';
    yield put(actions.batchProcessPayoutsFailure(errorMessage));
  }
}

export default function* payoutSaga() {
  yield takeLatest(types.FETCH_PAYOUTS_REQUEST, fetchPayouts);
  yield takeLatest(types.PROCESS_PAYOUT_REQUEST, processPayout);
  yield takeLatest(types.BATCH_PROCESS_PAYOUTS_REQUEST, batchProcessPayouts);
}
