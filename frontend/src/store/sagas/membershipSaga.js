import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { membersApi } from '../../services/api';

const fallbackMembers = [
  { id: 'mem-1', name: 'Arun Kumar', email: 'arun@example.com', role: 'Distributor', referralCode: 'AK10001', mobile: '+919876543210', status: 'ACTIVE', joinedDate: '2026-01-15', sponsorId: null },
  { id: 'mem-2', name: 'Priya Chandran', email: 'priya@example.com', role: 'Associate', referralCode: 'AK10002', mobile: '+919876543211', status: 'ACTIVE', joinedDate: '2026-02-10', sponsorId: 'mem-1' },
  { id: 'mem-3', name: 'Karthik Raja', email: 'karthik@example.com', role: 'Distributor', referralCode: 'AK10003', mobile: '+919876543212', status: 'ACTIVE', joinedDate: '2026-02-15', sponsorId: 'mem-1' },
  { id: 'mem-4', name: 'Anitha Selvam', email: 'anitha@example.com', role: 'Associate', referralCode: 'AK10004', mobile: '+919876543213', status: 'ACTIVE', joinedDate: '2026-02-20', sponsorId: 'mem-1' },
  { id: 'mem-5', name: 'Vignesh Balaji', email: 'vignesh@example.com', role: 'Distributor', referralCode: 'AK10005', mobile: '+919876543214', status: 'ACTIVE', joinedDate: '2026-03-01', sponsorId: 'mem-2' },
];

function* fetchMembers() {
  try {
    const response = yield call(membersApi.getAll, { limit: 100 });
    const rawList = Array.isArray(response) ? response : response?.data || response?.items || [];

    const membersList = rawList.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email || '',
      mobile: m.mobile || '',
      role: m.role === 'ADMIN' ? 'Admin' : m.role === 'SUB_ADMIN' ? 'SubAdmin' : 'Associate',
      referralCode: m.memberCode,
      status: m.status,
      joinedDate: m.joiningDate ? m.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      sponsorId: m.referrerId || null,
      referrer: m.referrer || null,
    }));

    yield put(actions.fetchMembersSuccess(membersList.length > 0 ? membersList : fallbackMembers));
  } catch (error) {
    yield put(actions.fetchMembersSuccess(fallbackMembers));
  }
}

function* addMember(action) {
  try {
    const payload = action.payload;

    const createDto = {
      name: payload.name,
      mobile: payload.mobile || `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: payload.email,
      password: payload.password || 'AK@12345678',
      role: payload.role === 'Admin' ? 'ADMIN' : 'MEMBER',
      referrerId: payload.sponsorId || payload.referrerId || undefined,
    };

    const created = yield call(membersApi.createByAdmin, createDto);

    const newMember = {
      id: created.id,
      name: created.name,
      email: created.email || '',
      mobile: created.mobile || '',
      role: created.role === 'ADMIN' ? 'Admin' : 'Associate',
      referralCode: created.memberCode,
      status: created.status,
      joinedDate: created.joiningDate ? created.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      sponsorId: created.referrerId || null,
    };

    yield put(actions.addMemberSuccess(newMember));
    yield put(actions.fetchMembersRequest());
  } catch (error) {
    yield put(actions.addMemberFailure(error.message || 'Failed to enroll new referral'));
  }
}

function* updateMember(action) {
  try {
    const { id, ...data } = action.payload;
    const updated = yield call(membersApi.update, id, data);
    yield put(actions.updateMemberSuccess(updated));
    yield put(actions.fetchMembersRequest());
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
