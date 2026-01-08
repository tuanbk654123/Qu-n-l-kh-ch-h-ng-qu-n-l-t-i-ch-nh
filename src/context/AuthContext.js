import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      if (response.data.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      return { success: true };
    } catch (error) {
      setUser(null);
      return { success: true }; // Vẫn logout dù API fail
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isManager = () => {
    return user && (user.role === 'admin' || user.role === 'manager');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isManager,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

