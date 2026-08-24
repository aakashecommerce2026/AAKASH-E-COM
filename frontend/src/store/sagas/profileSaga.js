import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { membersApi } from '../../services/api';

function* updateProfileWorker(action) {
  try {
    const { name, email, mobile, address, profilePhoto, bankDetails, upiId, secondaryUpiId, upiProvider } = action.payload;

    // Sanitize payload to strictly include valid UpdateMemberProfileDto properties
    const apiPayload = {
      ...(name ? { name: name.trim() } : {}),
      ...(email ? { email: email.trim() } : {}),
      ...(mobile ? { mobile: mobile.trim() } : {}),
      ...(address ? { address } : {}),
      ...(profilePhoto ? { profilePhoto } : {}),
      ...(upiId ? { upiId: upiId.trim() } : {}),
      bankDetails: {
        ...(bankDetails || {}),
        ...(upiId !== undefined ? { upiId: upiId.trim() } : {}),
        ...(secondaryUpiId !== undefined ? { secondaryUpiId: secondaryUpiId.trim() } : {}),
        ...(upiProvider !== undefined ? { upiProvider } : {}),
      },
    };

    const response = yield call(membersApi.updateProfile, apiPayload);

    const updatedUser = {
      ...action.payload,
      id: response.id || action.payload.id,
      name: response.name || action.payload.name,
      email: response.email || action.payload.email,
      mobile: response.mobile || action.payload.mobile,
      role: response.role === 'ADMIN' ? 'Admin' : (action.payload.role || 'Member'),
      referralCode: response.memberCode || action.payload.referralCode,
      status: response.status || action.payload.status,
      bankDetails: apiPayload.bankDetails,
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
