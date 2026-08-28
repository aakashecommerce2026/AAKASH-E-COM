import * as types from './actionTypes';

// Membership Actions
export const fetchMembersRequest = () => ({
  type: types.FETCH_MEMBERS_REQUEST,
});

export const fetchMembersSuccess = (members) => ({
  type: types.FETCH_MEMBERS_SUCCESS,
  payload: members,
});

export const fetchMembersFailure = (error) => ({
  type: types.FETCH_MEMBERS_FAILURE,
  payload: error,
});

export const addMemberRequest = (memberData) => ({
  type: types.ADD_MEMBER_REQUEST,
  payload: memberData,
});

export const addMemberSuccess = (member) => ({
  type: types.ADD_MEMBER_SUCCESS,
  payload: member,
});

export const addMemberFailure = (error) => ({
  type: types.ADD_MEMBER_FAILURE,
  payload: error,
});

export const updateMemberRequest = (memberData) => ({
  type: types.UPDATE_MEMBER_REQUEST,
  payload: memberData,
});

export const updateMemberSuccess = (member) => ({
  type: types.UPDATE_MEMBER_SUCCESS,
  payload: member,
});

export const updateMemberFailure = (error) => ({
  type: types.UPDATE_MEMBER_FAILURE,
  payload: error,
});

export const deleteMemberRequest = (id) => ({
  type: types.DELETE_MEMBER_REQUEST,
  payload: id,
});

export const deleteMemberSuccess = (id) => ({
  type: types.DELETE_MEMBER_SUCCESS,
  payload: id,
});

export const deleteMemberFailure = (error) => ({
  type: types.DELETE_MEMBER_FAILURE,
  payload: error,
});

// Commission Actions & Filters
export const fetchCommissionsRequest = () => ({
  type: types.FETCH_COMMISSIONS_REQUEST,
});

export const fetchCommissionsSuccess = (commissions) => ({
  type: types.FETCH_COMMISSIONS_SUCCESS,
  payload: commissions,
});

export const fetchCommissionsFailure = (error) => ({
  type: types.FETCH_COMMISSIONS_FAILURE,
  payload: error,
});

export const setCommissionFilters = (filters) => ({
  type: types.SET_COMMISSION_FILTERS,
  payload: filters,
});

export const resetCommissionFilters = () => ({
  type: types.RESET_COMMISSION_FILTERS,
});

// Membership Commission Engine Actions
export const generateMembershipCommissionsRequest = (payload) => ({
  type: types.GENERATE_MEMBERSHIP_COMMISSIONS_REQUEST,
  payload,
});

export const generateMembershipCommissionsSuccess = (result) => ({
  type: types.GENERATE_MEMBERSHIP_COMMISSIONS_SUCCESS,
  payload: result,
});

export const generateMembershipCommissionsFailure = (error) => ({
  type: types.GENERATE_MEMBERSHIP_COMMISSIONS_FAILURE,
  payload: error,
});

export const updateCommissionStrategyRules = (rules) => ({
  type: types.UPDATE_COMMISSION_STRATEGY_RULES,
  payload: rules,
});

export const resetCommissionStrategyRules = () => ({
  type: types.RESET_COMMISSION_STRATEGY_RULES,
});

export const clearCommissionEngineLogs = () => ({
  type: types.CLEAR_COMMISSION_ENGINE_LOGS,
});

export const fetchCommissionConfigsRequest = () => ({
  type: types.FETCH_COMMISSION_CONFIGS_REQUEST,
});

export const fetchCommissionConfigsSuccess = (payload) => ({
  type: types.FETCH_COMMISSION_CONFIGS_SUCCESS,
  payload,
});

export const fetchCommissionConfigsFailure = (error) => ({
  type: types.FETCH_COMMISSION_CONFIGS_FAILURE,
  payload: error,
});

export const saveMembershipConfigRequest = (payload) => ({
  type: types.SAVE_MEMBERSHIP_CONFIG_REQUEST,
  payload,
});

export const saveMembershipConfigSuccess = (payload) => ({
  type: types.SAVE_MEMBERSHIP_CONFIG_SUCCESS,
  payload,
});

export const saveMembershipConfigFailure = (error) => ({
  type: types.SAVE_MEMBERSHIP_CONFIG_FAILURE,
  payload: error,
});

export const saveRepurchaseConfigRequest = (payload) => ({
  type: types.SAVE_REPURCHASE_CONFIG_REQUEST,
  payload,
});

export const saveRepurchaseConfigSuccess = (payload) => ({
  type: types.SAVE_REPURCHASE_CONFIG_SUCCESS,
  payload,
});

export const saveRepurchaseConfigFailure = (error) => ({
  type: types.SAVE_REPURCHASE_CONFIG_FAILURE,
  payload: error,
});

export const toggleCommissionDeductions = (enableDeductions) => ({
  type: types.TOGGLE_COMMISSION_DEDUCTIONS,
  payload: enableDeductions,
});

export const fetchTdsStatusRequest = () => ({
  type: types.FETCH_TDS_STATUS_REQUEST,
});

export const fetchTdsStatusSuccess = (enabled) => ({
  type: types.FETCH_TDS_STATUS_SUCCESS,
  payload: enabled,
});

export const fetchTdsStatusFailure = (error) => ({
  type: types.FETCH_TDS_STATUS_FAILURE,
  payload: error,
});

export const saveTdsStatusRequest = (enabled) => ({
  type: types.SAVE_TDS_STATUS_REQUEST,
  payload: enabled,
});

export const saveTdsStatusSuccess = (enabled) => ({
  type: types.SAVE_TDS_STATUS_SUCCESS,
  payload: enabled,
});

export const saveTdsStatusFailure = (error) => ({
  type: types.SAVE_TDS_STATUS_FAILURE,
  payload: error,
});

// Repurchase Commission Engine Action Creators
export const generateRepurchaseCommissionsRequest = (payload) => ({
  type: types.GENERATE_REPURCHASE_COMMISSIONS_REQUEST,
  payload,
});

export const generateRepurchaseCommissionsSuccess = (result) => ({
  type: types.GENERATE_REPURCHASE_COMMISSIONS_SUCCESS,
  payload: result,
});

export const generateRepurchaseCommissionsFailure = (error) => ({
  type: types.GENERATE_REPURCHASE_COMMISSIONS_FAILURE,
  payload: error,
});

export const updateRepurchaseStrategyRules = (rules) => ({
  type: types.UPDATE_REPURCHASE_STRATEGY_RULES,
  payload: rules,
});

export const resetRepurchaseStrategyRules = () => ({
  type: types.RESET_REPURCHASE_STRATEGY_RULES,
});

export const clearRepurchaseEngineLogs = () => ({
  type: types.CLEAR_REPURCHASE_ENGINE_LOGS,
});


// Auth & Profile Actions
export const loginRequest = (email, password, role) => ({
  type: types.LOGIN_REQUEST,
  payload: { email, password, role },
});

export const loginSuccess = (user, token) => ({
  type: types.LOGIN_SUCCESS,
  payload: { user, token },
});

export const loginFailure = (error) => ({
  type: types.LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: types.LOGOUT,
});

export const checkAuthSession = () => ({
  type: types.CHECK_AUTH_SESSION,
});

export const updateProfileRequest = (profileData) => ({
  type: types.UPDATE_PROFILE_REQUEST,
  payload: profileData,
});

export const updateProfileSuccess = (user) => ({
  type: types.UPDATE_PROFILE_SUCCESS,
  payload: user,
});

export const updateProfileFailure = (error) => ({
  type: types.UPDATE_PROFILE_FAILURE,
  payload: error,
});

export const clearProfileStatus = () => ({
  type: types.CLEAR_PROFILE_STATUS,
});

// Repurchase Actions & Filters
export const fetchRepurchasesRequest = () => ({
  type: types.FETCH_REPURCHASES_REQUEST,
});

export const fetchRepurchasesSuccess = (repurchases) => ({
  type: types.FETCH_REPURCHASES_SUCCESS,
  payload: repurchases,
});

export const fetchRepurchasesFailure = (error) => ({
  type: types.FETCH_REPURCHASES_FAILURE,
  payload: error,
});

export const addRepurchaseRequest = (repurchaseData) => ({
  type: types.ADD_REPURCHASE_REQUEST,
  payload: repurchaseData,
});

export const addRepurchaseSuccess = (repurchase) => ({
  type: types.ADD_REPURCHASE_SUCCESS,
  payload: repurchase,
});

export const addRepurchaseFailure = (error) => ({
  type: types.ADD_REPURCHASE_FAILURE,
  payload: error,
});

export const setRepurchaseFilters = (filters) => ({
  type: types.SET_REPURCHASE_FILTERS,
  payload: filters,
});

export const resetRepurchaseFilters = () => ({
  type: types.RESET_REPURCHASE_FILTERS,
});

// Payout Actions & Filters
export const fetchPayoutsRequest = () => ({
  type: types.FETCH_PAYOUTS_REQUEST,
});

export const fetchPayoutsSuccess = (payouts) => ({
  type: types.FETCH_PAYOUTS_SUCCESS,
  payload: payouts,
});

export const fetchPayoutsFailure = (error) => ({
  type: types.FETCH_PAYOUTS_FAILURE,
  payload: error,
});

export const processPayoutRequest = (payoutId) => ({
  type: types.PROCESS_PAYOUT_REQUEST,
  payload: payoutId,
});

export const processPayoutSuccess = (payout) => ({
  type: types.PROCESS_PAYOUT_SUCCESS,
  payload: payout,
});

export const processPayoutFailure = (error) => ({
  type: types.PROCESS_PAYOUT_FAILURE,
  payload: error,
});

export const batchProcessPayoutsRequest = (payoutIds) => ({
  type: types.BATCH_PROCESS_PAYOUTS_REQUEST,
  payload: payoutIds,
});

export const batchProcessPayoutsSuccess = (updatedPayouts) => ({
  type: types.BATCH_PROCESS_PAYOUTS_SUCCESS,
  payload: updatedPayouts,
});

export const batchProcessPayoutsFailure = (error) => ({
  type: types.BATCH_PROCESS_PAYOUTS_FAILURE,
  payload: error,
});

export const setPayoutFilters = (filters) => ({
  type: types.SET_PAYOUT_FILTERS,
  payload: filters,
});

export const resetPayoutFilters = () => ({
  type: types.RESET_PAYOUT_FILTERS,
});
