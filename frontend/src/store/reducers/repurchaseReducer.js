import * as types from '../actionTypes';

const initialFilters = {
  searchQuery: '',
  statusFilter: 'ALL',
  startDate: '',
  endDate: '',
};

const initialState = {
  repurchases: [],
  loading: false,
  submitting: false,
  error: null,
  filters: initialFilters,
};

const repurchaseReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_REPURCHASES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.FETCH_REPURCHASES_SUCCESS:
      return {
        ...state,
        loading: false,
        repurchases: action.payload,
        error: null,
      };
    case types.FETCH_REPURCHASES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case types.ADD_REPURCHASE_REQUEST:
      return {
        ...state,
        submitting: true,
        error: null,
      };
    case types.ADD_REPURCHASE_SUCCESS:
      return {
        ...state,
        submitting: false,
        repurchases: [action.payload, ...state.repurchases],
        error: null,
      };
    case types.ADD_REPURCHASE_FAILURE:
      return {
        ...state,
        submitting: false,
        error: action.payload,
      };
    case types.SET_REPURCHASE_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case types.RESET_REPURCHASE_FILTERS:
      return {
        ...state,
        filters: initialFilters,
      };
    default:
      return state;
  }
};

export default repurchaseReducer;
