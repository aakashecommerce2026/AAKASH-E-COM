import { put, delay, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';

// Mock DB Dataset
const mockMembersData = [
  { id: 1, name: 'Arun Kumar', email: 'arun@example.com', role: 'Distributor', referralCode: 'AK100', sponsorId: null, joinedDate: '2026-01-15' },
  { id: 2, name: 'Priya Chandran', email: 'priya@example.com', role: 'Associate', referralCode: 'PC101', sponsorId: 1, joinedDate: '2026-02-10' },
  { id: 3, name: 'Karthik Raja', email: 'karthik@example.com', role: 'Distributor', referralCode: 'KR102', sponsorId: 1, joinedDate: '2026-02-15' },
  { id: 4, name: 'Anitha Selvam', email: 'anitha@example.com', role: 'Associate', referralCode: 'AS103', sponsorId: 1, joinedDate: '2026-02-20' },
  { id: 5, name: 'Vignesh Balaji', email: 'vignesh@example.com', role: 'Distributor', referralCode: 'VB104', sponsorId: 2, joinedDate: '2026-03-01' },
  { id: 6, name: 'Deepa Sundar', email: 'deepa@example.com', role: 'Associate', referralCode: 'DS105', sponsorId: 2, joinedDate: '2026-03-05' },
  { id: 7, name: 'Suresh Mani', email: 'suresh@example.com', role: 'Distributor', referralCode: 'SM106', sponsorId: 3, joinedDate: '2026-03-10' },
  { id: 8, name: 'Meena Ramasamy', email: 'meena@example.com', role: 'Associate', referralCode: 'MR107', sponsorId: 3, joinedDate: '2026-03-12' },
  { id: 9, name: 'Naveen Dev', email: 'naveen@example.com', role: 'Distributor', referralCode: 'ND108', sponsorId: 4, joinedDate: '2026-03-15' },
  { id: 10, name: 'Divya Pandian', email: 'divya@example.com', role: 'Associate', referralCode: 'DP109', sponsorId: 4, joinedDate: '2026-03-18' },
];

// Worker Sagas with simulated active database latency delays
function* fetchMembers() {
  try {
    yield delay(800); // 800ms DB latency
    yield put(actions.fetchMembersSuccess(mockMembersData));
  } catch (error) {
    yield put(actions.fetchMembersFailure(error.message || 'Failed to fetch network members'));
  }
}

function* addMember(action) {
  try {
    yield delay(500); // 500ms DB latency
    const newMember = {
      id: Date.now(),
      ...action.payload,
      role: action.payload.role || 'Associate',
      joinedDate: new Date().toISOString().split('T')[0],
    };
    yield put(actions.addMemberSuccess(newMember));

    // Auto-trigger Membership Commission Engine if payment is confirmed
    if (action.payload.isPaymentConfirmed !== false) {
      const membershipTxId = action.payload.membershipTxId || `MTX-${Date.now()}`;
      const membershipAmount = action.payload.membershipAmount || 10000;

      yield put(actions.generateMembershipCommissionsRequest({
        member: newMember,
        membershipTxId,
        membershipAmount,
        isPaymentConfirmed: true,
      }));
    }
  } catch (error) {
    yield put(actions.addMemberFailure(error.message || 'Failed to enroll new referral'));
  }
}

function* updateMember(action) {
  try {
    yield delay(900); // 900ms DB latency
    yield put(actions.updateMemberSuccess(action.payload));
  } catch (error) {
    yield put(actions.updateMemberFailure(error.message || 'Failed to update member profile'));
  }
}

// Watcher Saga
export default function* membershipSaga() {
  yield takeLatest(types.FETCH_MEMBERS_REQUEST, fetchMembers);
  yield takeLatest(types.ADD_MEMBER_REQUEST, addMember);
  yield takeLatest(types.UPDATE_MEMBER_REQUEST, updateMember);
}
