import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'superadmin') return <Navigate to="/transactions" replace />;
  return children;
}