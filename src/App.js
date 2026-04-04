import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute     from './components/PrivateRoute';
import SuperAdminRoute  from './components/SuperAdminRoute';
import AnalyticsRoute   from './components/AnalyticsRoute';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics    from './pages/Analytics';
import Users        from './pages/Users';

export default function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/analytics"    element={<AnalyticsRoute><Analytics /></AnalyticsRoute>} />
          <Route path="/users"        element={<SuperAdminRoute><Users /></SuperAdminRoute>} />
          <Route path="*"             element={<Navigate to="/transactions" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}