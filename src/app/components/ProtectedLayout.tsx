import { Navigate } from 'react-router';
import { getToken, parseJwtPayload } from '../api/client';
import Layout from './Layout';

export default function ProtectedLayout({ expectedRole }: { expectedRole: 'manager' | 'employee' }) {
  const token = getToken();
  const role = parseJwtPayload(token)?.role;

  if (!token || role !== expectedRole) {
    return <Navigate to="/" replace />;
  }

  return <Layout role={expectedRole} />;
}
