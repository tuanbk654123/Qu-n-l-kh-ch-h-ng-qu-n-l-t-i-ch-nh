import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Bạn không có quyền truy cập trang này</h2>
        <p>Chỉ quản trị viên mới có thể truy cập.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

