import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';
import { Icon } from '../../components/ui/Icons';

export function AdminLayout() {
  const { currentUser } = useUser();

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `kn-tab ${isActive ? 'kn-tab-active' : ''}`;

  return (
    <div className="space-y-6">
      <div className="kn-page-header">
        <div>
          <h1 className="kn-page-title">Admin Console</h1>
          <p className="kn-page-copy">Manage capacity, teams, bookings, and floor operations from one control surface.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <nav className="kn-tabs min-w-max" aria-label="Admin navigation">
          <NavLink to="/admin" end className={tabClass}>
            <Icon name="dashboard" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/desks" className={tabClass}>
            <Icon name="desk" />
            Desks
          </NavLink>
          <NavLink to="/admin/bookings" className={tabClass}>
            <Icon name="bookings" />
            Bookings
          </NavLink>
          <NavLink to="/admin/users" className={tabClass}>
            <Icon name="users" />
            Users
          </NavLink>
          <NavLink to="/admin/teams" className={tabClass}>
            <Icon name="building" />
            Teams
          </NavLink>
          <NavLink to="/admin/floors" className={tabClass}>
            <Icon name="floor" />
            Floors
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
