import axios from 'axios';

// Get backend URL from environment variables for production, or fallback to relative proxy for local development
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expiration (401 Unauthorized)
api.interceptors.request.use(
  (config) => config,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
