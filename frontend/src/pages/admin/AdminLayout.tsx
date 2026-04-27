import { Outlet, Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

export function AdminLayout() {
  const { currentUser } = useUser();

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <Outlet />
    </div>
  );
}
