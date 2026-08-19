import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { membersApi } from '../../services/api';

function* updateProfileWorker(action) {
  try {
    const response = yield call(membersApi.updateProfile, action.payload);

    const updatedUser = {
      id: response.id,
      name: response.name,
      email: response.email,
      mobile: response.mobile,
      role: response.role === 'ADMIN' ? 'Admin' : 'Member',
      referralCode: response.memberCode,
      status: response.status,
    };

    // Save to localStorage session
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      parsed.user = updatedUser;
      localStorage.setItem('auth', JSON.stringify(parsed));
    }

    yield put(actions.updateProfileSuccess(updatedUser));
  } catch (error) {
    yield put(actions.updateProfileFailure(error.message || 'Failed to save member profile settings'));
  }
}

export default function* profileSaga() {
  yield takeLatest(types.UPDATE_PROFILE_REQUEST, updateProfileWorker);
}
