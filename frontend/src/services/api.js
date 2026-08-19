import axios from 'axios';

// Base URL points to NestJS backend API prefix /api/v1 (or via Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  },
);

// Auth API Endpoints
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
};

// Members API Endpoints
export const membersApi = {
  getAll: (params) =>
    apiClient.get('/admin/members', { params }).catch(() => apiClient.get('/members', { params })),
  getById: (id) => apiClient.get(`/members/${id}`),
  create: (data) => apiClient.post('/members', data),
  createByAdmin: (data) => apiClient.post('/admin/members', data),
  update: (id, data) => apiClient.put(`/members/${id}`, data),
  reassignReferrer: (id, data) => apiClient.post(`/admin/members/${id}/reassign-referrer`, data),
  getProfile: () => apiClient.get('/members/profile/me'),
  updateProfile: (data) => apiClient.put('/members/profile/me', data),
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
