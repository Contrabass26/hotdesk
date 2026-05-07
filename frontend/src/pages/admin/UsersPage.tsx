import { useEffect, useState } from 'react';
import type { User } from '../../types';
import { api } from '../../services/api';
import { useUser } from '../../contexts/UserContext';

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

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-blue-500">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.isAdmin
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}
                  >
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggleAdmin(user)}
                    disabled={updating === user.id || user.id === currentUser?.id}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${user.isAdmin
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      } disabled:opacity-40`}
                    title={user.id === currentUser?.id ? "You can't change your own role" : undefined}
                  >
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
