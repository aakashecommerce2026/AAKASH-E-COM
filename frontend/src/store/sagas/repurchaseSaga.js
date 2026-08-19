import { call, put, takeLatest, select } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { repurchaseApi } from '../../services/api';
import { RepurchaseCommissionProcessor } from '../../services/commissionEngine/RepurchaseCommissionProcessor';
import { RepurchaseCommissionStrategy } from '../../services/commissionEngine/RepurchaseCommissionStrategy';

const fallbackRepurchases = [
  { id: 'REP-1001', memberId: 'mem-1', memberCode: 'AK10001', memberName: 'Arun Kumar', productName: 'Groceries & Household Super Pack', category: 'Groceries/Household', quantity: 1, unitPrice: 4998, totalAmount: 4998, businessVolume: 124.95, paymentMethod: 'UPI', status: 'Completed', date: '2026-07-18', orderRef: 'REF-20260718-01', remarks: 'Monthly Groceries Supply' },
  { id: 'REP-1002', memberId: 'mem-2', memberCode: 'AK10002', memberName: 'Priya Chandran', productName: 'Household Essentials Bundle', category: 'Groceries/Household', quantity: 1, unitPrice: 4250, totalAmount: 4250, businessVolume: 106.25, paymentMethod: 'Bank Transfer', status: 'Completed', date: '2026-07-15', orderRef: 'REF-20260715-02', remarks: 'Bulk distributor groceries order' },
  { id: 'REP-1003', memberId: 'mem-3', memberCode: 'AK10003', memberName: 'Karthik Raja', productName: 'Daily Kitchen & Household Kit', category: 'Groceries/Household', quantity: 1, unitPrice: 5997, totalAmount: 5997, businessVolume: 149.93, paymentMethod: 'Wallet', status: 'Completed', date: '2026-07-12', orderRef: 'REF-20260712-03', remarks: 'Groceries order completed' },
];

function* fetchRepurchases() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      yield put(actions.fetchRepurchasesSuccess(fallbackRepurchases));
      return;
    }

    const response = yield call(repurchaseApi.getAll, { limit: 100 });
    const rawList = Array.isArray(response) ? response : response?.data || response?.items || [];

    const repurchasesList = rawList.map((item) => ({
      id: item.id,
      memberId: item.memberId,
      memberCode: item.member?.memberCode || 'N/A',
      memberName: item.member?.name || 'Member',
      productName: item.remarks || 'Repurchase Order',
      category: 'Groceries/Household',
      quantity: 1,
      unitPrice: Number(item.amount),
      totalAmount: Number(item.amount),
      businessVolume: Math.round(Number(item.amount) * 0.025 * 100) / 100,
      paymentMethod: 'UPI',
      status: 'Completed',
      date: item.transactionDate ? item.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      orderRef: item.transactionRef,
      remarks: item.remarks || '',
    }));

    yield put(actions.fetchRepurchasesSuccess(repurchasesList.length > 0 ? repurchasesList : fallbackRepurchases));
  } catch (error) {
    yield put(actions.fetchRepurchasesSuccess(fallbackRepurchases));
  }
}

function* addRepurchase(action) {
  try {
    const payload = action.payload;

    const createDto = {
      transactionRef: payload.orderRef || `TXN-${Date.now()}`,
      memberId: payload.memberId || payload.memberCode,
      amount: Number(payload.totalAmount || payload.unitPrice || 1000),
      remarks: payload.remarks || payload.productName || 'Repurchase Entry',
    };

    const created = yield call(repurchaseApi.create, createDto);

    const newEntry = {
      id: created.id,
      memberId: created.memberId,
      memberCode: created.member?.memberCode || payload.memberCode || 'AK100',
      memberName: created.member?.name || payload.memberName || 'Member',
      productName: created.remarks || 'Repurchase Order',
      totalAmount: Number(created.amount),
      unitPrice: Number(created.amount),
      status: 'Completed',
      date: created.transactionDate ? created.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      orderRef: created.transactionRef,
      remarks: created.remarks || '',
    };

    yield put(actions.addRepurchaseSuccess(newEntry));
    yield put(actions.fetchRepurchasesRequest());
  } catch (error) {
    yield put(actions.addRepurchaseFailure(error.message || 'Failed to place repurchase order'));
  }
}

function* generateRepurchaseCommissionsSaga(action) {
  try {
    const { member, repurchaseTxId, repurchaseAmount, isPaymentConfirmed, simulateFault } = action.payload;
    const membersState = yield select((state) => state.membership.members || []);
    const strategyRules = yield select((state) => state.commission.repurchaseStrategyRules);
    const enableDeductions = yield select((state) => state.commission.enableDeductions);
    const customStrategy = new RepurchaseCommissionStrategy(strategyRules);

    const result = RepurchaseCommissionProcessor.processRepurchaseCommission({
      member,
      repurchaseTxId,
      repurchaseAmount,
      isPaymentConfirmed: isPaymentConfirmed !== false,
      membersList: membersState,
      strategy: customStrategy,
      simulateFault: !!simulateFault,
      enableDeductions: enableDeductions !== false,
    });

    if (result.success) {
      yield put(
        actions.generateRepurchaseCommissionsSuccess({
          commissionRecords: result.commissionRecords,
          ledgerEntries: result.ledgerEntries,
          auditLog: result.auditLog,
          repurchaseTxId,
        }),
      );
    } else {
      yield put(
        actions.generateRepurchaseCommissionsFailure(
          result.error || 'Repurchase Commission Engine processing failed.',
        ),
      );
    }
  } catch (err) {
    yield put(
      actions.generateRepurchaseCommissionsFailure(err.message || 'Repurchase Commission Engine Execution Exception'),
    );
  }
}

export default function* repurchaseSaga() {
  yield takeLatest(types.FETCH_REPURCHASES_REQUEST, fetchRepurchases);
  yield takeLatest(types.ADD_REPURCHASE_REQUEST, addRepurchase);
  yield takeLatest(types.GENERATE_REPURCHASE_COMMISSIONS_REQUEST, generateRepurchaseCommissionsSaga);
}
