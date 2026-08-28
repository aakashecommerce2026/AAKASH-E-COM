import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { membersApi } from '../../services/api';

function* updateProfileWorker(action) {
  try {
    const { name, username, email, mobile, address, profilePhoto, bankDetails, upiId, secondaryUpiId, upiProvider } = action.payload;

    // Sanitize payload to strictly include valid UpdateMemberProfileDto properties
    const apiPayload = {
      ...(name ? { name: name.trim() } : {}),
      ...(username ? { username: username.trim() } : {}),
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
      username: response.username !== undefined ? response.username : action.payload.username,
      email: response.email || action.payload.email,
      mobile: response.mobile || action.payload.mobile,
      address: response.address !== undefined ? response.address : action.payload.address,
      profilePhoto: response.profilePhoto !== undefined ? response.profilePhoto : action.payload.profilePhoto,
      role: response.role === 'ADMIN' || response.role === 'SUB_ADMIN' ? 'Admin' : (action.payload.role || 'Member'),
      memberRole: response.role || action.payload.memberRole,
      referralCode: response.memberCode || action.payload.referralCode,
      status: response.status || action.payload.status,
      upiId: response.upiId || response.bankDetails?.upiId || apiPayload.upiId || action.payload.upiId || '',
      secondaryUpiId: response.bankDetails?.secondaryUpiId || apiPayload.bankDetails?.secondaryUpiId || action.payload.secondaryUpiId || '',
      upiProvider: response.bankDetails?.upiProvider || apiPayload.bankDetails?.upiProvider || action.payload.upiProvider || 'Google Pay',
      bankDetails: response.bankDetails || apiPayload.bankDetails,
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
