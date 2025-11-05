import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Helper function to get token from both sources
const getTokenFromStorage = () => {
  const localStorageToken = localStorage.getItem('token');
  if (localStorageToken) {
    return localStorageToken;
  }

  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  return cookieToken || null;
};

// Helper function to remove token from both sources
const removeToken = () => {
  localStorage.removeItem('token');
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ ADDED: Debug logging
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // ✅ ADDED: Debug logging
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    // ✅ ADDED: Debug logging
    console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      removeToken();
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyEmail: (data) => api.post('/auth/verify-email', data),  // ✅ THIS IS THE KEY ONE
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  deleteAccount: (data) => api.delete('/auth/delete-account', { data }),
  googleAuth: () => `${API_BASE_URL}/auth/google`,
  githubAuth: () => `${API_BASE_URL}/auth/github`,
};

export const profileAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
};

// ✅ ADD: CV API functions
export const cvAPI = {
  analyze: (cvData) => api.post('/api/cv/analyze', cvData),
  getHistory: () => api.get('/api/cv/history'),
  deleteHistory: (id) => api.delete(`/api/cv/history/${id}`)
};


export default api;
