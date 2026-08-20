import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { distributionApi } from '../../services/api';

function* fetchPayouts() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      yield put(actions.fetchPayoutsSuccess([]));
      return;
    }

    const response = yield call(distributionApi.getPending, { limit: 100 });
    const pendingData = Array.isArray(response) ? response : response?.data || response?.items || [];

    const payoutsList = pendingData.map((item, idx) => ({
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

    yield put(actions.fetchPayoutsSuccess(payoutsList));
  } catch (err) {
    yield put(actions.fetchPayoutsFailure(err.message || 'Failed to fetch payout records'));
  }
}

function* processPayout(action) {
  try {
    const memberId = action.payload;
    const batchResponse = yield call(distributionApi.processBatch, {
      memberIds: [memberId],
      remarks: 'Individual Payout Release from Admin Console',
    });

    const today = new Date().toISOString().split('T')[0];
    const updated = {
      id: memberId,
      status: 'Processed',
      processedDate: today,
      transactionRef: batchResponse.batchNo || `BATCH-NEFT${Math.floor(100000 + Math.random() * 900000)}`,
    };

    yield put(actions.processPayoutSuccess(updated));
    yield put(actions.fetchPayoutsRequest());
  } catch (error) {
    yield put(actions.processPayoutFailure(error.message || 'Failed to process individual payout'));
  }
}

function* batchProcessPayouts(action) {
  try {
    const memberIds = action.payload;
    const batchResponse = yield call(distributionApi.processBatch, {
      memberIds,
      remarks: 'Batch Payout Release from Admin Console',
    });

    const today = new Date().toISOString().split('T')[0];
    const results = memberIds.map((id) => ({
      id,
      status: 'Processed',
      processedDate: today,
      transactionRef: batchResponse.batchNo || `BATCH-NEFT${Math.floor(100000 + Math.random() * 900000)}`,
    }));

    yield put(actions.batchProcessPayoutsSuccess(results));
    yield put(actions.fetchPayoutsRequest());
  } catch (error) {
    yield put(actions.batchProcessPayoutsFailure(error.message || 'Failed to execute batch payout release'));
  }
}

export default function* payoutSaga() {
  yield takeLatest(types.FETCH_PAYOUTS_REQUEST, fetchPayouts);
  yield takeLatest(types.PROCESS_PAYOUT_REQUEST, processPayout);
  yield takeLatest(types.BATCH_PROCESS_PAYOUTS_REQUEST, batchProcessPayouts);
}
