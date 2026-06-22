import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/accounts/profile/');
      setUser(response.data);
      return response.data;
    } catch (error) {
      logout();
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Failed to load profile during init', error);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for global logout events (from Axios interceptor)
    const handleLogoutEvent = () => {
      logout();
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/accounts/login/', { email, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      const userData = await fetchProfile();
      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/accounts/register/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (uid, token) => {
    try {
      const response = await api.post('/accounts/verify-email/', { uid, token });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await api.post('/accounts/password-reset/', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (uid, token, password) => {
    try {
      const response = await api.post('/accounts/password-reset/confirm/', { 
        uid, 
        token, 
        password,
        password_confirm: password 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (formData) => {
    try {
      // Determine if formData is an instance of FormData (multipart upload for picture)
      const headers = formData instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' };

      const response = await api.patch('/accounts/profile/', formData, { headers });
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    logout,
    refreshUser: fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
