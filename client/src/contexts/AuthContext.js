import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Token is handled by axios interceptor
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      // Token is handled by axios interceptor
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed. Please check your backend connection.' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { 
        username, 
        email, 
        password 
      });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      // Token is handled by axios interceptor
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      // Handle validation errors (array format from express-validator)
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => {
          const field = err.param || err.path || '';
          const msg = err.msg || err.message || 'Invalid value';
          return field ? `${field}: ${msg}` : msg;
        }).join(', ');
        return { 
          success: false, 
          message: errorMessages || 'Validation failed. Please check your input.'
        };
      }
      
      // Handle message format (user already exists, etc.)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Registration failed. Please check your backend connection.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('token');
    } catch {}
    // Token removal is handled by interceptor
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const loginWithToken = async (token) => {
    try {
      setToken(token);
      localStorage.setItem('token', token);
      await fetchUser();
      return { success: true };
    } catch (error) {
      console.error('Login with token error:', error);
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
