import { all, fork } from 'redux-saga/effects';
import membershipSaga from './membershipSaga';
import commissionSaga from './commissionSaga';
import authSaga from './authSaga';
import profileSaga from './profileSaga';
import repurchaseSaga from './repurchaseSaga';
import payoutSaga from './payoutSaga';

export default function* rootSaga() {
  yield all([
    fork(membershipSaga),
    fork(commissionSaga),
    fork(authSaga),
    fork(profileSaga),
    fork(repurchaseSaga),
    fork(payoutSaga),
  ]);
}
