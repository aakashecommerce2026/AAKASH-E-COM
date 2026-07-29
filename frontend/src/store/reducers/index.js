import { combineReducers } from 'redux';
import membershipReducer from './membershipReducer';
import commissionReducer from './commissionReducer';
import authReducer from './authReducer';
import repurchaseReducer from './repurchaseReducer';
import payoutReducer from './payoutReducer';

const rootReducer = combineReducers({
  membership: membershipReducer,
  commission: commissionReducer,
  auth: authReducer,
  repurchase: repurchaseReducer,
  payout: payoutReducer,
});

export default rootReducer;

