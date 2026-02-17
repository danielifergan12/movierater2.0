import axios from 'axios';

// Get API URL from environment variable
// In development, use empty string (proxy will handle it)
// In production, set REACT_APP_API_URL to your backend URL (e.g., https://your-backend.railway.app)
const API_URL = process.env.REACT_APP_API_URL || '';

// Log API URL for debugging (remove in production)
if (process.env.NODE_ENV === 'production') {
  console.log('[API Config] Using API URL:', API_URL || 'No API URL set - using relative paths');
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
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

// Create a public API instance without auth interceptor for public endpoints
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

