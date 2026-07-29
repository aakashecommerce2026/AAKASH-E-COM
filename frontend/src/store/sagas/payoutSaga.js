import { put, delay, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';

// Mock Payout Records
const mockPayoutsData = [
  {
    id: 'PAY-8001',
    memberId: 1,
    memberName: 'Arun Kumar',
    memberCode: 'AK100',
    type: 'Direct Referral Commission',
    grossAmount: 15000,
    tdsDeduction: 750, // 5%
    adminFee: 750,      // 5%
    netPayable: 13500,
    status: 'Processed',
    createdDate: '2026-06-01',
    processedDate: '2026-06-02',
    transactionRef: 'NEFT-IN983421098',
    bankAccount: 'HDFC ****4821',
  },
  {
    id: 'PAY-8002',
    memberId: 2,
    memberName: 'Priya Chandran',
    memberCode: 'PC101',
    type: 'Direct Referral Commission',
    grossAmount: 12500,
    tdsDeduction: 625,
    adminFee: 625,
    netPayable: 11250,
    status: 'Pending',
    createdDate: '2026-07-01',
    processedDate: null,
    transactionRef: 'PENDING_APPROVAL',
    bankAccount: 'SBI ****9012',
  },
  {
    id: 'PAY-8003',
    memberId: 3,
    memberName: 'Karthik Raja',
    memberCode: 'KR102',
    type: 'Repurchase Commission',
    grossAmount: 8400,
    tdsDeduction: 420,
    adminFee: 420,
    netPayable: 7560,
    status: 'Pending',
    createdDate: '2026-07-05',
    processedDate: null,
    transactionRef: 'PENDING_APPROVAL',
    bankAccount: 'ICICI ****3341',
  },
  {
    id: 'PAY-8004',
    memberId: 1,
    memberName: 'Arun Kumar',
    memberCode: 'AK100',
    type: 'Repurchase Commission',
    grossAmount: 25000,
    tdsDeduction: 1250,
    adminFee: 1250,
    netPayable: 22500,
    status: 'Processed',
    createdDate: '2026-06-15',
    processedDate: '2026-06-16',
    transactionRef: 'IMPS-20260616-778',
    bankAccount: 'HDFC ****4821',
  },
  {
    id: 'PAY-8005',
    memberId: 5,
    memberName: 'Vignesh Balaji',
    memberCode: 'VB104',
    type: 'Direct Referral Commission',
    grossAmount: 6000,
    tdsDeduction: 300,
    adminFee: 300,
    netPayable: 5400,
    status: 'Pending',
    createdDate: '2026-07-15',
    processedDate: null,
    transactionRef: 'PENDING_APPROVAL',
    bankAccount: 'AXIS ****1190',
  },
];

// Worker Sagas with simulated active DB latency delays
function* fetchPayouts() {
  try {
    yield delay(850); // 850ms DB latency
    yield put(actions.fetchPayoutsSuccess(mockPayoutsData));
  } catch (error) {
    yield put(actions.fetchPayoutsFailure(error.message || 'Failed to fetch payout records'));
  }
}

function* processPayout(action) {
  try {
    yield delay(900); // 900ms DB latency
    const today = new Date().toISOString().split('T')[0];
    const refNum = `NEFT-TXN${Math.floor(100000 + Math.random() * 900000)}`;
    const updated = {
      id: action.payload,
      status: 'Processed',
      processedDate: today,
      transactionRef: refNum,
    };
    yield put(actions.processPayoutSuccess(updated));
  } catch (error) {
    yield put(actions.processPayoutFailure(error.message || 'Failed to process individual payout'));
  }
}

function* batchProcessPayouts(action) {
  try {
    yield delay(1200); // 1200ms DB latency
    const today = new Date().toISOString().split('T')[0];
    const results = action.payload.map((id) => ({
      id,
      status: 'Processed',
      processedDate: today,
      transactionRef: `BATCH-NEFT${Math.floor(100000 + Math.random() * 900000)}`,
    }));
    yield put(actions.batchProcessPayoutsSuccess(results));
  } catch (error) {
    yield put(actions.batchProcessPayoutsFailure(error.message || 'Failed to execute batch payout release'));
  }
}

export default function* payoutSaga() {
  yield takeLatest(types.FETCH_PAYOUTS_REQUEST, fetchPayouts);
  yield takeLatest(types.PROCESS_PAYOUT_REQUEST, processPayout);
  yield takeLatest(types.BATCH_PROCESS_PAYOUTS_REQUEST, batchProcessPayouts);
}
