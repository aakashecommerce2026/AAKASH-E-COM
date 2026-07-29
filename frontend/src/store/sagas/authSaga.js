import { call, put, takeLatest, delay } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';

// Mock Auth API
const mockLoginApi = (email, password, role) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isPasswordValid = password === 'password';
      const cleanEmail = (email || '').toLowerCase().trim();
      const isAdminAttempt = cleanEmail.includes('admin') || role === 'Admin';
      
      if (!isPasswordValid) {
        reject(new Error('Invalid password. Password is: password'));
        return;
      }

      if (isAdminAttempt) {
        resolve({
          user: {
            id: 0,
            name: 'System Admin',
            email: email || 'admin@aakashmlm.com',
            role: 'Admin',
            referralCode: 'ADMIN-ROOT',
          },
          token: 'mock-admin-jwt-token-' + Date.now(),
        });
      } else {
        const mockMembers = [
          { id: 1, name: 'Arun Kumar', email: 'arun@example.com', role: 'Distributor', referralCode: 'AK100' },
          { id: 2, name: 'Priya Chandran', email: 'priya@example.com', role: 'Associate', referralCode: 'PC101' },
          { id: 3, name: 'Karthik Raja', email: 'karthik@example.com', role: 'Distributor', referralCode: 'KR102' },
          { id: 4, name: 'Anitha Selvam', email: 'anitha@example.com', role: 'Associate', referralCode: 'AS103' },
          { id: 5, name: 'Vignesh Balaji', email: 'vignesh@example.com', role: 'Distributor', referralCode: 'VB104' },
          { id: 6, name: 'Deepa Sundar', email: 'deepa@example.com', role: 'Associate', referralCode: 'DS105' },
          { id: 7, name: 'Suresh Mani', email: 'suresh@example.com', role: 'Distributor', referralCode: 'SM106' },
          { id: 8, name: 'Meena Ramasamy', email: 'meena@example.com', role: 'Associate', referralCode: 'MR107' },
          { id: 9, name: 'Naveen Dev', email: 'naveen@example.com', role: 'Distributor', referralCode: 'ND108' },
          { id: 10, name: 'Divya Pandian', email: 'divya@example.com', role: 'Associate', referralCode: 'DP109' },
        ];
        const matched = mockMembers.find(m => m.email.toLowerCase() === cleanEmail) || mockMembers[0];
        
        resolve({
          user: {
            id: matched.id,
            name: matched.name,
            email: email || matched.email,
            role: 'Member',
            referralCode: matched.referralCode,
          },
          token: 'mock-member-jwt-token-' + Date.now(),
        });
      }
    }, 500);
  });
};

function* loginWorker(action) {
  try {
    const { email, password, role } = action.payload;
    const response = yield call(mockLoginApi, email, password, role);
    
    // Save to local storage
    localStorage.setItem('auth', JSON.stringify(response));
    
    yield put(actions.loginSuccess(response.user, response.token));
  } catch (error) {
    yield put(actions.loginFailure(error.message));
  }
}

function* logoutWorker() {
  localStorage.removeItem('auth');
  yield delay(0);
}

function* checkSessionWorker() {
  try {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      yield put(actions.loginSuccess(authData.user, authData.token));
    }
  } catch {
    localStorage.removeItem('auth');
  }
}

export default function* authSaga() {
  yield takeLatest(types.LOGIN_REQUEST, loginWorker);
  yield takeLatest(types.LOGOUT, logoutWorker);
  yield takeLatest(types.CHECK_AUTH_SESSION, checkSessionWorker);
}
