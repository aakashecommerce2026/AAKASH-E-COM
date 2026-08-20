import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { membersApi } from '../../services/api';



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

    yield put(actions.fetchMembersSuccess(membersList));
  } catch (err) {
    yield put(actions.fetchMembersFailure(err.message || 'Failed to fetch members list'));
  }
}

function* addMember(action) {
  try {
    const payload = action.payload;

    const createDto = {
      name: payload.name,
      mobile: payload.mobile || `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: payload.email,
      ...(payload.password ? { password: payload.password } : {}),
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
      tempPassword: created.tempPassword || payload.password,
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
