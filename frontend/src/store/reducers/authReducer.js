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

    case types.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        saving: false,
        saveSuccess: true,
        user: action.payload,
        error: null,
      };

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
