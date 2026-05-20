import axios from 'axios';

const API_BASE = import.meta.env.MODE === 'development' 
  ? '/api' 
  : 'https://retailshop-rtwt.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 seconds timeout to handle cold starts (especially on Render free tier)
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // If it's a 401, handle as logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const isCustomerPath = window.location.pathname.startsWith('/customer');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/customer/login') {
        window.location.href = isCustomerPath ? '/customer/login' : '/login';
      }
      return Promise.reject(error);
    }

    // Retry logic for 5xx errors or timeouts (max 2 retries)
    config.retryCount = config.retryCount || 0;
    const shouldRetry = (error.code === 'ECONNABORTED' || error.response?.status >= 500) && config.retryCount < 2;

    if (shouldRetry) {
      config.retryCount += 1;
      console.warn(`Retrying request (${config.retryCount}/2): ${config.url}`);
      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, config.retryCount * 1000));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  login: (data) => api.post('auth/login', data),
  register: (data) => api.post('auth/register', data),
  registerAdmin: (data) => api.post('auth/register-admin', data),
};

// ---- Product API ----
let categoriesCache = null;
export const productAPI = {
  getAll: (page = 0, size = 20, search = '') =>
    api.get('products', { params: { page, size, search } }),
  getById: (id) => api.get(`products/${id}`),
  create: (data) => {
    categoriesCache = null; // Clear cache on change
    return api.post('products', data);
  },
  update: (id, data) => {
    categoriesCache = null; // Clear cache on change
    return api.put(`products/${id}`, data);
  },
  delete: (id) => {
    categoriesCache = null; // Clear cache on change
    return api.delete(`products/${id}`);
  },
  getLowStock: () => api.get('products/low-stock'),
  getCategories: async () => {
    if (categoriesCache) return categoriesCache;
    const res = await api.get('products/categories');
    categoriesCache = res;
    return res;
  },
  calculatePrice: (id, quantity, unit) =>
    api.get(`products/${id}/calculate-price`, { params: { quantity, unit } }),
};

// ---- Sales API ----
export const saleAPI = {
  create: (data) => api.post('sales', data),
  getById: (id) => api.get(`sales/${id}`),
  getByBill: (billNumber) => api.get(`sales/bill/${billNumber}`),
  getAll: (page = 0, size = 20) =>
    api.get('sales', { params: { page, size } }),
};

// ---- Dashboard API ----
export const dashboardAPI = {
  getData: () => api.get('dashboard'),
};

// ---- Order API ----
export const orderAPI = {
  create: (data) => api.post('orders', data),
  getAll: (page = 0, size = 20) =>
    api.get('orders', { params: { page, size } }),
  updateStatus: (id, status) =>
    api.put(`orders/${id}/status`, null, { params: { status } }),
  getMyOrders: () => api.get('orders/my-orders'),
  cancelMyOrder: (id) => api.put(`orders/my-orders/${id}/cancel`),
};

// ---- Customer API ----
export const customerAPI = {
  getAll: () => api.get('customers'),
  search: (name) => api.get('customers/search', { params: { name } }),
};

export default api;
