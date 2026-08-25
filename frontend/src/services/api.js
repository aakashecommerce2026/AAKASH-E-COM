import axios from 'axios';

// Base URL points to NestJS backend API prefix /api/v1 (or via Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to automatically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'API request failed';

    if (status === 401) {
      console.warn('Authentication session token expired or invalid:', message);
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/admin-login')
      ) {
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  },
);

// Auth API Endpoints
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  adminLogin: (credentials) => apiClient.post('/auth/admin-login', credentials),
  memberLogin: (credentials) => apiClient.post('/auth/member-login', credentials),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => apiClient.put('/member/change-password', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
};

// OTP API Endpoints
export const otpApi = {
  sendOtp: (data) =>
    apiClient.post('/otp/send', typeof data === 'string' ? { email: data, purpose: 'EMAIL_VERIFICATION' } : data),
  verifyOtp: (data, code, purpose) =>
    apiClient.post(
      '/otp/verify',
      typeof data === 'string'
        ? { email: data, otp: code, purpose: purpose || 'EMAIL_VERIFICATION' }
        : data,
    ),
  sendRegistrationOtp: (email) => apiClient.post('/otp/send', { email, purpose: 'EMAIL_VERIFICATION' }),
  verifyRegistrationOtp: (email, code) =>
    apiClient.post('/otp/verify', { email, otp: code, purpose: 'EMAIL_VERIFICATION' }),
  sendPasswordResetOtp: (email) => apiClient.post('/otp/send', { email, purpose: 'PASSWORD_RESET' }),
  verifyPasswordResetOtp: (email, code) =>
    apiClient.post('/otp/verify', { email, otp: code, purpose: 'PASSWORD_RESET' }),
};

// Members API Endpoints
export const membersApi = {
  getAll: (params) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      return apiClient.get('/admin/members', { params }).catch(() => apiClient.get('/members', { params }));
    }
    return apiClient.get('/members', { params });
  },
  getById: (id) => apiClient.get(`/members/${id}`),
  create: (data) => apiClient.post('/members', data),
  createByAdmin: (data) => apiClient.post('/admin/members', data),
  update: (id, data) => apiClient.put(`/admin/members/${id}`, data),
  reassignReferrer: (id, data) => apiClient.post(`/admin/members/${id}/reassign-referrer`, data),
  getProfile: () => apiClient.get('/member/profile'),
  updateProfile: (data) => apiClient.put('/member/profile', data),
  uploadProfilePhoto: (formData) =>
    apiClient.post('/member/profile/photo', formData, {
      headers: {
        'Content-Type': undefined,
      },
    }),
};

// Promotions API Endpoints
export const promotionsApi = {
  getMyStatus: () => apiClient.get('/promotions/my-status'),
  getMemberProgress: (memberId) => apiClient.get(`/promotions/progress/${memberId}`),
  recalculateAll: () => apiClient.post('/promotions/admin/recalculate'),
};

// Repurchase API Endpoints
export const repurchaseApi = {
  getAll: (params) => apiClient.get('/admin/repurchase', { params }),
  getById: (id) => apiClient.get(`/admin/repurchase/${id}`),
  create: (data) => apiClient.post('/admin/repurchase', data),
  update: (id, data) => apiClient.put(`/admin/repurchase/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/repurchase/${id}`),
};

// Distribution API Endpoints
export const distributionApi = {
  getPending: (params) => apiClient.get('/admin/distribution/pending', { params }),
  processBatch: (data) => apiClient.post('/admin/distribution/process', data),
  getHistory: (params) => apiClient.get('/admin/distribution/history', { params }),
  getBatchById: (id) => apiClient.get(`/admin/distribution/${id}`),
};

// Admin Reports & Export API Endpoints
export const reportsApi = {
  getDaily: (params) => apiClient.get('/admin/reports/daily', { params }),
  getWeekly: (params) => apiClient.get('/admin/reports/weekly', { params }),
  getMonthly: (params) => apiClient.get('/admin/reports/monthly', { params }),
  getExportPdfUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/admin/reports/export/pdf?${query}`;
  },
  getExportExcelUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/admin/reports/export/excel?${query}`;
  },
  getExportStatus: (jobId) => apiClient.get(`/admin/reports/export/status/${jobId}`),
};

// Audit Logs API Endpoints
export const auditApi = {
  getLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
};

// Commission API Endpoints
export const commissionApi = {
  getMembershipLedger: (params) => apiClient.get('/membership-commissions/ledger', { params }),
  getMembershipConfig: (params) => apiClient.get('/membership-commissions/config', { params }),
  triggerMembershipCommission: (memberId, params) =>
    apiClient.post(`/membership-commissions/trigger/${memberId}`, null, { params }),
  getRepurchaseLedger: (params) => apiClient.get('/repurchase-commissions/ledger', { params }),
  getRepurchaseConfig: (params) => apiClient.get('/repurchase-commissions/config', { params }),
  triggerRepurchaseCommission: (entryId) =>
    apiClient.post(`/repurchase-commissions/trigger/${entryId}`),
};

// Hierarchy & Downline Network API Endpoints
export const hierarchyApi = {
  getDownline: (memberId, params) => apiClient.get(`/admin/hierarchy/${memberId}/downline`, { params }),
  getSummary: (memberId, params) => apiClient.get(`/admin/hierarchy/${memberId}/summary`, { params }),
  getDirectReferrals: (memberId) => apiClient.get(`/admin/hierarchy/${memberId}/direct-referrals`),
  getMemberDownline: (params) => apiClient.get('/member/network/downline', { params }),
  getMemberSummary: () => apiClient.get('/member/network/summary'),
  getMemberReferrals: () => apiClient.get('/member/network/referrals'),
};

// Executive Dashboard Aggregation API Endpoints
export const dashboardApi = {
  getMemberStats: (params) => apiClient.get('/admin/dashboard/members', { params }),
  getEarningsStats: (params) => apiClient.get('/admin/dashboard/earnings', { params }),
  getBusinessStats: (params) => apiClient.get('/admin/dashboard/business', { params }),
  getActivityFeed: (params) => apiClient.get('/admin/dashboard/activity', { params }),
  getMemberDashboard: () => apiClient.get('/member/dashboard'),
};

