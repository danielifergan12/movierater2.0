import axios from 'axios';

// Get API URL from environment variable
// In development, use empty string (proxy will handle it)
// In production, set REACT_APP_API_URL to your backend URL (e.g., https://your-backend.railway.app)
const API_URL = process.env.REACT_APP_API_URL || '';

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

export default api;

