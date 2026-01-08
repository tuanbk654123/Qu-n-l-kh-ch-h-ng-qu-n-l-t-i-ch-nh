import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';
import Login from '../modules/auth/Login';
import Customers from '../modules/customers';
import Businesses from '../modules/businesses';
import Tasks from '../modules/tasks';
import Transactions from '../modules/transactions';
import Dashboard from '../modules/dashboard';
import MyAccount from '../modules/account/MyAccount';
import Users from '../modules/users';
import Contracts from '../modules/contracts';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/businesses" element={<Businesses />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/my-account" element={<MyAccount />} />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;

