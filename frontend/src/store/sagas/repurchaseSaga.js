import { call, put, takeLatest, select } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { repurchaseApi, commissionApi } from '../../services/api';
import { RepurchaseCommissionProcessor } from '../../services/commissionEngine/RepurchaseCommissionProcessor';
import { RepurchaseCommissionStrategy } from '../../services/commissionEngine/RepurchaseCommissionStrategy';

function* fetchRepurchases() {
  try {
    const storedAuth = localStorage.getItem('auth');
    if (!storedAuth) {
      yield put(actions.fetchRepurchasesSuccess([]));
      return;
    }

    const authData = JSON.parse(storedAuth);
    const userRole = authData?.user?.memberRole || authData?.user?.role;
    if (userRole === 'MEMBER' || userRole === 'Member') {
      yield put(actions.fetchRepurchasesSuccess([]));
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

    yield put(actions.fetchRepurchasesSuccess(repurchasesList));
  } catch (err) {
    yield put(actions.fetchRepurchasesFailure(err.message || 'Failed to fetch repurchase history'));
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

    if (repurchaseTxId && typeof repurchaseTxId === 'string' && repurchaseTxId.includes('-')) {
      try {
        yield call(commissionApi.triggerRepurchaseCommission, repurchaseTxId);
      } catch {
        // Fallback to client processor if entry id is non-UUID simulation
      }
    }

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
