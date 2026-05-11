import axios from 'axios';

const API_BASE = 'https://retailshop-rtwt.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  login: (data) => api.post('auth/login', data),
  register: (data) => api.post('auth/register', data),
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
