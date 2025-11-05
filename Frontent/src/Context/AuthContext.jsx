import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions
const getTokenFromStorage = () => {
  return localStorage.getItem('token') || null;
};

const storeToken = (token) => {
  localStorage.setItem('token', token);
};

const removeToken = () => {
  localStorage.removeItem('token');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [showProfileNotification, setShowProfileNotification] = useState(false);

  // ✅ SIMPLIFIED: Basic auth initialization that WORKS
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getTokenFromStorage();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            const response = await api.get('/users/profile');
            if (response.data.success) {
              setUser(response.data.user);
              
              // Check profile completeness
              const isComplete = response.data.user.fullname?.firstname && 
                                response.data.user.fullname?.lastname;
              setProfileComplete(isComplete);
              
              if (!isComplete) {
                setShowProfileNotification(true);
              }
            }
          } catch (error) {
            // If token is invalid, clear it
            console.log('Token validation failed:', error);
            removeToken();
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        // ✅ ALWAYS set loading to false
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ SIMPLE: Login function that works
  const login = (userData, token) => {
    const userWithToken = { ...userData, token };
    setUser(userWithToken);
    if (token) {
      storeToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const logout = () => {
    removeToken();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setProfileComplete(false);
    setShowProfileNotification(false);
  };

  const value = {
    user,
    loading,
    profileComplete,
    showProfileNotification,
    setShowProfileNotification,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
