import * as types from '../actionTypes';

const initialState = {
  user: null,
  token: null,
  loading: false,
  saving: false,
  saveSuccess: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case types.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case types.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        saving: false,
        saveSuccess: false,
        error: null,
      };

    case types.UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        saving: true,
        saveSuccess: false,
        error: null,
      };

    case types.UPDATE_PROFILE_SUCCESS: {
      const payload = action.payload || {};
      const updatedUser = {
        ...state.user,
        ...payload,
        username: payload.username !== undefined ? payload.username : state.user?.username,
        address: payload.address !== undefined ? payload.address : state.user?.address,
        profilePhoto: payload.profilePhoto !== undefined ? payload.profilePhoto : state.user?.profilePhoto,
        upiId: payload.upiId || payload.bankDetails?.upiId || state.user?.upiId || '',
        secondaryUpiId: payload.secondaryUpiId || payload.bankDetails?.secondaryUpiId || state.user?.secondaryUpiId || '',
        upiProvider: payload.upiProvider || payload.bankDetails?.upiProvider || state.user?.upiProvider || 'Google Pay',
        role: payload.role === 'ADMIN' || payload.role === 'SUB_ADMIN' || payload.role === 'Admin'
          ? 'Admin'
          : (payload.role === 'MEMBER' || payload.role === 'Member' ? 'Member' : (state.user?.role || 'Member')),
        memberRole: payload.memberRole || payload.role || state.user?.memberRole,
        referralCode: payload.memberCode || payload.referralCode || state.user?.referralCode,
      };

      try {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          parsed.user = updatedUser;
          localStorage.setItem('auth', JSON.stringify(parsed));
        }
      } catch (e) {}

      return {
        ...state,
        saving: false,
        saveSuccess: true,
        user: updatedUser,
        error: null,
      };
    }

    case types.UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        saving: false,
        saveSuccess: false,
        error: action.payload,
      };

    case types.CLEAR_PROFILE_STATUS:
      return {
        ...state,
        saveSuccess: false,
        error: null,
      };

    default:
      return state;
  }
};

export default authReducer;
