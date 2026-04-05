import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar          from './components/Navbar';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Transactions    from './pages/Transactions';
import Analytics       from './pages/Analytics';
import Users           from './pages/Users';
import PrivateRoute    from './components/PrivateRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import AnalyticsRoute  from './components/AnalyticsRoute';

import './styles/custom.css';

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/transactions" replace />}
      />

      {/* All authenticated users */}
      <Route path="/transactions" element={
        <PrivateRoute>
          <AppLayout><Transactions /></AppLayout>
        </PrivateRoute>
      } />

      {/* Analyst and above */}
      <Route path="/dashboard" element={
        <AnalyticsRoute>
          <AppLayout><Dashboard /></AppLayout>
        </AnalyticsRoute>
      } />

      <Route path="/analytics" element={
        <AnalyticsRoute>
          <AppLayout><Analytics /></AppLayout>
        </AnalyticsRoute>
      } />

      {/* Superadmin only */}
      <Route path="/users" element={
        <SuperAdminRoute>
          <AppLayout><Users /></AppLayout>
        </SuperAdminRoute>
      } />

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? "/transactions" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}