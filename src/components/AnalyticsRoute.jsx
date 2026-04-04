import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!['analyst', 'admin', 'superadmin'].includes(user.role))
    return <Navigate to="/transactions" replace />;
  return children;
}