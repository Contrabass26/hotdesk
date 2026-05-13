import { useEffect, useState } from 'react';
import type { User } from '../../types';
import { api } from '../../services/api';
import { useUser } from '../../contexts/useUser';
import { Icon } from '../../components/ui/Icons';

export function UsersPage() {
  const { currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleAdmin = async (user: User) => {
    setUpdating(user.id);
    try {
      const updated = await api.updateUser(user.id, !user.isAdmin, user.teamId);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="kn-loading"><div className="kn-panel px-6 py-4">Loading users...</div></div>;

  return (
    <div className="kn-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="kn-table min-w-[620px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-black">
                  <div className="flex items-center gap-3">
                    <span className="kn-icon-tile text-xs font-black">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs font-bold text-[var(--kn-green-700)]">(you)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="text-[var(--kn-muted)]">{user.email}</td>
                <td>
                  <span
                    className={`kn-badge ${user.isAdmin
                        ? 'kn-badge-blue'
                        : 'kn-badge-neutral'
                      }`}
                  >
                    {user.isAdmin && <Icon name="shield" className="h-3.5 w-3.5" />}
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => handleToggleAdmin(user)}
                    disabled={updating === user.id || user.id === currentUser?.id}
                    className={`kn-button ${user.isAdmin ? 'kn-button-secondary' : 'kn-button-primary'}`}
                    title={user.id === currentUser?.id ? "You can't change your own role" : undefined}
                  >
                    <Icon name="shield" />
                    {updating === user.id
                      ? '...'
                      : user.isAdmin
                        ? 'Remove Admin'
                        : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
