import { put, delay, takeLatest, select } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { RepurchaseCommissionProcessor } from '../../services/commissionEngine/RepurchaseCommissionProcessor';
import { RepurchaseCommissionStrategy } from '../../services/commissionEngine/RepurchaseCommissionStrategy';

// Initial Mock Repurchase Records
// Initial Mock Repurchase Records
const mockRepurchasesData = [
  {
    id: 'REP-1001',
    memberId: 1,
    memberCode: 'MEM-101',
    memberName: 'Arun Kumar',
    productName: 'Groceries & Household Super Pack',
    category: 'Groceries/Household',
    quantity: 1,
    unitPrice: 4998,
    totalAmount: 4998,
    businessVolume: 124.95, // 2.5% of 4,998
    paymentMethod: 'UPI',
    status: 'Completed',
    date: '2026-07-18',
    orderRef: 'REF-20260718-01',
    remarks: 'Monthly Groceries Supply',
  },
  {
    id: 'REP-1002',
    memberId: 2,
    memberCode: 'MEM-102',
    memberName: 'Priya Chandran',
    productName: 'Household Essentials Bundle',
    category: 'Groceries/Household',
    quantity: 1,
    unitPrice: 4250,
    totalAmount: 4250,
    businessVolume: 106.25, // 2.5% of 4,250
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    date: '2026-07-15',
    orderRef: 'REF-20260715-02',
    remarks: 'Bulk distributor groceries order',
  },
  {
    id: 'REP-1003',
    memberId: 3,
    memberCode: 'MEM-103',
    memberName: 'Karthik Raja',
    productName: 'Daily Kitchen & Household Kit',
    category: 'Groceries/Household',
    quantity: 1,
    unitPrice: 5997,
    totalAmount: 5997,
    businessVolume: 149.93, // 2.5% of 5,997
    paymentMethod: 'Wallet',
    status: 'Completed',
    date: '2026-07-12',
    orderRef: 'REF-20260712-03',
    remarks: 'Groceries order completed',
  },
  {
    id: 'REP-1004',
    memberId: 4,
    memberCode: 'MEM-104',
    memberName: 'Anitha Selvam',
    productName: 'Groceries Premium Combo',
    category: 'Groceries/Household',
    quantity: 1,
    unitPrice: 3200,
    totalAmount: 3200,
    businessVolume: 80.00, // 2.5% of 3,200
    paymentMethod: 'Cash',
    status: 'Completed',
    date: '2026-07-08',
    orderRef: 'REF-20260708-04',
    remarks: 'Counter pick up',
  },
  {
    id: 'REP-1005',
    memberId: 5,
    memberCode: 'MEM-105',
    memberName: 'Vignesh Balaji',
    productName: 'Family Household Groceries Box',
    category: 'Groceries/Household',
    quantity: 1,
    unitPrice: 8000,
    totalAmount: 8000,
    businessVolume: 200.00, // 2.5% of 8,000
    paymentMethod: 'UPI',
    status: 'Completed',
    date: '2026-07-05',
    orderRef: 'REF-20260705-05',
    remarks: 'Level 2 Upline Repurchase Order',
  },
  {
    id: 'REP-1006',
    memberId: 7,
    memberCode: 'MEM-107',
    memberName: 'Suresh Mani',
    productName: 'Mega Kitchen Household Supplies',
    category: 'Groceries/Household',
    quantity: 1,
    unitPrice: 10000,
    totalAmount: 10000,
    businessVolume: 250.00, // 2.5% of 10,000
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    date: '2026-07-01',
    orderRef: 'REF-20260701-06',
    remarks: 'Bulk Repurchase Order',
  },
];

// Worker Sagas with simulated active DB latency delays
function* fetchRepurchases() {
  try {
    yield delay(500); // 500ms DB latency
    yield put(actions.fetchRepurchasesSuccess(mockRepurchasesData));

    // Retrieve network hierarchy members
    let membersList = yield select((state) => state.membership.members || []);
    if (!membersList || membersList.length === 0) {
      membersList = [
        { id: 1, name: 'Arun Kumar', referralCode: 'AK100', sponsorId: null },
        { id: 2, name: 'Priya Chandran', referralCode: 'PC101', sponsorId: 1 },
        { id: 3, name: 'Karthik Raja', referralCode: 'KR102', sponsorId: 1 },
        { id: 4, name: 'Anitha Selvam', referralCode: 'AS103', sponsorId: 1 },
        { id: 5, name: 'Vignesh Balaji', referralCode: 'VB104', sponsorId: 2 },
        { id: 6, name: 'Deepa Sundar', referralCode: 'DS105', sponsorId: 2 },
        { id: 7, name: 'Suresh Mani', referralCode: 'SM106', sponsorId: 3 },
        { id: 8, name: 'Meena Ramasamy', referralCode: 'MR107', sponsorId: 3 },
        { id: 9, name: 'Naveen Dev', referralCode: 'ND108', sponsorId: 4 },
        { id: 10, name: 'Divya Pandian', referralCode: 'DP109', sponsorId: 4 },
      ];
    }

    const strategyRules = yield select((state) => state.commission.repurchaseStrategyRules);
    const enableDeductions = yield select((state) => state.commission.enableDeductions);
    const customStrategy = new RepurchaseCommissionStrategy(strategyRules);

    // Process Repurchase Commission Engine for all existing repurchase records
    for (const item of mockRepurchasesData) {
      const purchasingMember = membersList.find((m) => String(m.id) === String(item.memberId)) || {
        id: item.memberId,
        name: item.memberName,
        referralCode: item.memberCode,
        sponsorId: item.memberId === 1 ? null : (item.memberId <= 4 ? 1 : item.memberId === 5 || item.memberId === 6 ? 2 : 3),
      };

      const result = RepurchaseCommissionProcessor.processRepurchaseCommission({
        member: purchasingMember,
        repurchaseTxId: item.orderRef || item.id,
        repurchaseAmount: item.totalAmount || item.unitPrice || 1000,
        isPaymentConfirmed: item.status === 'Completed' || item.status === 'Processing',
        membersList: membersList,
        strategy: customStrategy,
        enableDeductions: enableDeductions !== false,
      });

      if (result.success && result.commissionRecords.length > 0) {
        yield put(actions.generateRepurchaseCommissionsSuccess({
          commissionRecords: result.commissionRecords,
          ledgerEntries: result.ledgerEntries,
          auditLog: result.auditLog,
          repurchaseTxId: item.orderRef || item.id,
        }));
      }
    }
  } catch (error) {
    yield put(actions.fetchRepurchasesFailure(error.message || 'Failed to fetch repurchase order history'));
  }
}

function* addRepurchase(action) {
  try {
    yield delay(500); // DB latency simulation
    const newEntry = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      ...action.payload,
      date: action.payload.date || new Date().toISOString().split('T')[0],
      status: action.payload.status || 'Completed',
    };
    yield put(actions.addRepurchaseSuccess(newEntry));

    // Automatically trigger 20-level Repurchase Commission Engine
    const membersState = yield select((state) => state.membership.members || []);
    const purchasingMember = membersState.find((m) => String(m.id) === String(newEntry.memberId)) || {
      id: newEntry.memberId,
      name: newEntry.memberName,
      referralCode: newEntry.memberCode,
      sponsorId: 1, // Default fallback sponsor
    };

    yield put(actions.generateRepurchaseCommissionsRequest({
      member: purchasingMember,
      repurchaseTxId: newEntry.orderRef || newEntry.id,
      repurchaseAmount: newEntry.totalAmount || newEntry.unitPrice || 1000,
      isPaymentConfirmed: true,
    }));
  } catch (error) {
    yield put(actions.addRepurchaseFailure(error.message || 'Failed to place repurchase order'));
  }
}

// Dedicated Repurchase Commission Engine Worker Saga
function* generateRepurchaseCommissionsSaga(action) {
  try {
    yield delay(400); // Database transaction latency simulation

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
      yield put(actions.generateRepurchaseCommissionsSuccess({
        commissionRecords: result.commissionRecords,
        ledgerEntries: result.ledgerEntries,
        auditLog: result.auditLog,
        repurchaseTxId,
      }));
    } else {
      yield put(actions.generateRepurchaseCommissionsFailure(result.error || 'Repurchase Commission Engine processing failed. Transaction rolled back.'));
    }
  } catch (err) {
    yield put(actions.generateRepurchaseCommissionsFailure(err.message || 'Repurchase Commission Engine Execution Exception'));
  }
}

export default function* repurchaseSaga() {
  yield takeLatest(types.FETCH_REPURCHASES_REQUEST, fetchRepurchases);
  yield takeLatest(types.ADD_REPURCHASE_REQUEST, addRepurchase);
  yield takeLatest(types.GENERATE_REPURCHASE_COMMISSIONS_REQUEST, generateRepurchaseCommissionsSaga);
}
