import * as types from '../actionTypes';

const initialState = {
  members: [],
  loading: false,
  error: null,
};

const membershipReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_MEMBERS_REQUEST:
    case types.ADD_MEMBER_REQUEST:
    case types.UPDATE_MEMBER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.FETCH_MEMBERS_SUCCESS:
      return {
        ...state,
        loading: false,
        members: action.payload,
      };
    case types.ADD_MEMBER_SUCCESS:
      return {
        ...state,
        loading: false,
        members: [...state.members, action.payload],
      };
    case types.UPDATE_MEMBER_SUCCESS:
      return {
        ...state,
        loading: false,
        members: state.members.map((m) => m.id === action.payload.id ? action.payload : m),
      };
    case types.FETCH_MEMBERS_FAILURE:
    case types.ADD_MEMBER_FAILURE:
    case types.UPDATE_MEMBER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default membershipReducer;
