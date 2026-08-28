import * as types from '../actionTypes';
import { DEFAULT_MEMBERSHIP_RULES } from '../../services/commissionEngine/MembershipCommissionStrategy';
import { DEFAULT_REPURCHASE_RULES } from '../../services/commissionEngine/RepurchaseCommissionStrategy';

const initialFilters = {
  searchQuery: '',
  statusFilter: 'ALL',
  startDate: '',
  endDate: '',
};

const initialState = {
  commissions: [],
  loading: false,
  error: null,
  filters: initialFilters,
  strategyRules: DEFAULT_MEMBERSHIP_RULES,
  repurchaseStrategyRules: DEFAULT_REPURCHASE_RULES,
  enableDeductions: true, // Dynamic Admin Toggle for TDS (5%) & Admin Fee (5%)
  processedTxIds: [],
  engineLogs: [],
  repurchaseEngineLogs: [],
  ledgerEntries: [],
  processing: false,
  lastEngineResult: null,
  lastRepurchaseEngineResult: null,
};

const commissionReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_COMMISSIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.FETCH_COMMISSIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        commissions: action.payload,
        error: null,
      };
    case types.FETCH_COMMISSIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Engine Generation Handlers
    case types.GENERATE_MEMBERSHIP_COMMISSIONS_REQUEST:
      return {
        ...state,
        processing: true,
        error: null,
      };
    case types.GENERATE_MEMBERSHIP_COMMISSIONS_SUCCESS: {
      const { commissionRecords, auditLog, membershipTxId } = action.payload;
      return {
        ...state,
        processing: false,
        commissions: [...commissionRecords, ...state.commissions],
        processedTxIds: membershipTxId ? [...new Set([...state.processedTxIds, String(membershipTxId)])] : state.processedTxIds,
        engineLogs: [auditLog, ...state.engineLogs],
        lastEngineResult: action.payload,
        error: null,
      };
    }
    case types.GENERATE_MEMBERSHIP_COMMISSIONS_FAILURE:
      return {
        ...state,
        processing: false,
        error: action.payload,
      };

    // Repurchase Engine Handlers
    case types.GENERATE_REPURCHASE_COMMISSIONS_REQUEST:
      return {
        ...state,
        processing: true,
        error: null,
      };
    case types.GENERATE_REPURCHASE_COMMISSIONS_SUCCESS: {
      const { commissionRecords, ledgerEntries = [], auditLog, repurchaseTxId } = action.payload;
      return {
        ...state,
        processing: false,
        commissions: [...commissionRecords, ...state.commissions],
        ledgerEntries: [...ledgerEntries, ...state.ledgerEntries],
        processedTxIds: repurchaseTxId ? [...new Set([...state.processedTxIds, String(repurchaseTxId)])] : state.processedTxIds,
        repurchaseEngineLogs: [auditLog, ...state.repurchaseEngineLogs],
        lastRepurchaseEngineResult: action.payload,
        error: null,
      };
    }
    case types.GENERATE_REPURCHASE_COMMISSIONS_FAILURE:
      return {
        ...state,
        processing: false,
        error: action.payload,
      };

    // Configurable Membership & Repurchase Rules Handlers
    case types.FETCH_COMMISSION_CONFIGS_SUCCESS: {
      const { membershipRules, repurchaseRules, version } = action.payload;
      return {
        ...state,
        ...(membershipRules ? { strategyRules: membershipRules } : {}),
        ...(repurchaseRules ? { repurchaseStrategyRules: repurchaseRules } : {}),
        ...(version ? { currentMembershipVersion: version } : {}),
      };
    }
    case types.SAVE_MEMBERSHIP_CONFIG_SUCCESS: {
      const { rules, version } = action.payload;
      return {
        ...state,
        strategyRules: rules,
        currentMembershipVersion: version || state.currentMembershipVersion,
      };
    }
    case types.SAVE_REPURCHASE_CONFIG_SUCCESS: {
      return {
        ...state,
        repurchaseStrategyRules: action.payload,
      };
    }
    case types.UPDATE_COMMISSION_STRATEGY_RULES:
      return {
        ...state,
        strategyRules: action.payload,
      };
    case types.RESET_COMMISSION_STRATEGY_RULES:
      return {
        ...state,
        strategyRules: DEFAULT_MEMBERSHIP_RULES,
      };
    case types.UPDATE_REPURCHASE_STRATEGY_RULES:
      return {
        ...state,
        repurchaseStrategyRules: action.payload,
      };
    case types.RESET_REPURCHASE_STRATEGY_RULES:
      return {
        ...state,
        repurchaseStrategyRules: DEFAULT_REPURCHASE_RULES,
      };

    case types.CLEAR_COMMISSION_ENGINE_LOGS:
      return {
        ...state,
        engineLogs: [],
      };
    case types.CLEAR_REPURCHASE_ENGINE_LOGS:
      return {
        ...state,
        repurchaseEngineLogs: [],
      };

    case types.FETCH_TDS_STATUS_SUCCESS:
    case types.SAVE_TDS_STATUS_SUCCESS: {
      const isEnabled = Boolean(action.payload);
      return {
        ...state,
        enableDeductions: isEnabled,
      };
    }

    case types.TOGGLE_COMMISSION_DEDUCTIONS: {
      const isEnabled = Boolean(action.payload);
      const updatedCommissions = (state.commissions || []).map((comm) => {
        const gross = comm.amount || comm.calculatedAmount || 0;
        const tdsDeduction = isEnabled ? (gross * 5) / 100 : 0;
        const adminFee = isEnabled ? (gross * 5) / 100 : 0;
        const netPayableAmount = gross - tdsDeduction - adminFee;

        return {
          ...comm,
          tdsDeduction,
          adminFee,
          netPayableAmount,
          auditInfo: {
            ...(comm.auditInfo || {}),
            tdsRate: isEnabled ? '5% (Sec 194H)' : '0% (Reversed)',
            adminFeeRate: isEnabled ? '5%' : '0% (Reversed)',
            formula: isEnabled
              ? `Gross (${gross}) - 5% TDS (${tdsDeduction}) - 5% Admin (${adminFee}) = Net (${netPayableAmount})`
              : `Gross (${gross}) - 0% Deductions (Reversed) = Net (${netPayableAmount})`,
          },
        };
      });

      return {
        ...state,
        enableDeductions: isEnabled,
        commissions: updatedCommissions,
      };
    }

    case types.SET_COMMISSION_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case types.RESET_COMMISSION_FILTERS:
      return {
        ...state,
        filters: initialFilters,
      };
    default:
      return state;
  }
};

export default commissionReducer;
