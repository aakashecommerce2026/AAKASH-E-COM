import { call, put, delay, takeLatest } from 'redux-saga/effects';
import * as types from '../actionTypes';
import * as actions from '../actions';

// Mock DB Profile API call
const mockUpdateProfileApi = (profileData) => {
  return new Promise((resolve) => {
    // Simulated DB write
    resolve(profileData);
  });
};

function* updateProfileWorker(action) {
  try {
    // Program Redux-Saga latency delay (900ms)
    yield delay(900);

    const updatedUser = yield call(mockUpdateProfileApi, action.payload);

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
