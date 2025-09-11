import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateUser from './pages/CreateUser';
import ForgotPassword from './pages/ForgotPassword'; // ✅ Import ForgotPassword
import { AuthProvider, useAuth } from './context/AuthContext';

// Protects normal user routes
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a loading spinner
  return user ? children : <Navigate to="/login" />;
}

// Protects admin routes
function AdminPrivateRoute({ children }) {
  const adminToken = localStorage.getItem("admin_token");
  return adminToken ? children : <Navigate to="/admin-login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 font-sans">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ✅ New Route */}

          {/* Protected user route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            path="/admin-dashboard"
            element={
              <AdminPrivateRoute>
                <AdminDashboard />
              </AdminPrivateRoute>
            }
          />
          <Route
            path="/create-user"
            element={
              <AdminPrivateRoute>
                <CreateUser />
              </AdminPrivateRoute>
            }
          />

          {/* Redirect all unknown routes */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
