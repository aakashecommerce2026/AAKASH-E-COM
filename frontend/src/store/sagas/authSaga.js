import { call, put, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';
import { authApi } from '../../services/api';

function* loginWorker(action) {
  try {
    const { email, password, role } = action.payload;
    const identifier = email;
    const portalType = role; // 'Admin' or 'Member'

    // Call live NestJS backend auth endpoint with portalType enforcement
    const response = yield call(authApi.login, { identifier, password, portalType });

    const token = response.accessToken;
    const backendUser = response.user;

    // Map backend user model to frontend state format
    const user = {
      id: backendUser.id,
      name: backendUser.name,
      email: backendUser.email || backendUser.memberCode,
      mobile: backendUser.mobile,
      role: backendUser.role === 'ADMIN' || backendUser.role === 'SUB_ADMIN' ? 'Admin' : 'Member',
      memberRole: backendUser.role,
      referralCode: backendUser.memberCode,
      status: backendUser.status,
    };

    const authData = { user, token };

    // Save to local storage
    localStorage.setItem('auth', JSON.stringify(authData));
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);

    yield put(actions.loginSuccess(user, token));
  } catch (error) {
    yield put(actions.loginFailure(error.message || 'Login failed'));
  }
}

function* logoutWorker() {
  yield call([localStorage, 'removeItem'], 'auth');
  yield call([localStorage, 'removeItem'], 'token');
  yield call([localStorage, 'removeItem'], 'accessToken');
}

function* checkSessionWorker() {
  try {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      if (authData && authData.token) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('accessToken', authData.token);
        yield put(actions.loginSuccess(authData.user, authData.token));
      }
    }
  } catch {
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
  }
}

export default function* authSaga() {
  yield takeLatest(types.LOGIN_REQUEST, loginWorker);
  yield takeLatest(types.LOGOUT, logoutWorker);
  yield takeLatest(types.CHECK_AUTH_SESSION, checkSessionWorker);
}
