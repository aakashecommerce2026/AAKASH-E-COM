import * as types from '../actionTypes';

const initialFilters = {
  searchQuery: '',
  statusFilter: 'ALL',
  startDate: '',
  endDate: '',
};

const initialState = {
  payouts: [],
  loading: false,
  processing: false,
  error: null,
  filters: initialFilters,
};

const payoutReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_PAYOUTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.FETCH_PAYOUTS_SUCCESS:
      return {
        ...state,
        loading: false,
        payouts: action.payload,
        error: null,
      };
    case types.FETCH_PAYOUTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case types.PROCESS_PAYOUT_REQUEST:
    case types.BATCH_PROCESS_PAYOUTS_REQUEST:
      return {
        ...state,
        processing: true,
        error: null,
      };
    case types.PROCESS_PAYOUT_SUCCESS:
      return {
        ...state,
        processing: false,
        payouts: state.payouts.map((p) =>
          p.id === action.payload.id || p.memberId === action.payload.id
            ? { ...p, ...action.payload }
            : p
        ),
        error: null,
      };
    case types.BATCH_PROCESS_PAYOUTS_SUCCESS: {
      const updatedMap = new Map(action.payload.map((item) => [item.id, item]));
      return {
        ...state,
        processing: false,
        payouts: state.payouts.map((p) => {
          const update = updatedMap.get(p.id) || updatedMap.get(p.memberId);
          return update ? { ...p, ...update } : p;
        }),
        error: null,
      };
    }
    case types.PROCESS_PAYOUT_FAILURE:
    case types.BATCH_PROCESS_PAYOUTS_FAILURE:
      return {
        ...state,
        processing: false,
        error: action.payload,
      };
    case types.SET_PAYOUT_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case types.TOGGLE_COMMISSION_DEDUCTIONS: {
      const isEnabled = Boolean(action.payload);
      const updatedPayouts = state.payouts.map((p) => {
        const gross = p.grossAmount || p.amount || 0;
        const tdsDeduction = isEnabled ? (gross * 5) / 100 : 0;
        const adminFee = isEnabled ? (gross * 5) / 100 : 0;
        const netAmount = gross - tdsDeduction - adminFee;

        return {
          ...p,
          tdsDeduction,
          adminFee,
          netAmount,
        };
      });
      return {
        ...state,
        payouts: updatedPayouts,
      };
    }
    case types.RESET_PAYOUT_FILTERS:
      return {
        ...state,
        filters: initialFilters,
      };
    default:
      return state;
  }
};

export default payoutReducer;
