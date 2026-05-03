import { useEffect, useState } from 'react';
import type { Floor, Desk } from '../../types';
import { api } from '../../services/api';

export function DeskManagementPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedFloorDesks, setSelectedFloorDesks] = useState<Desk[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    api.getFloors()
      .then((data) => {
        setFloors(data);
        if (data.length > 0) setSelectedFloor(data[0]);
        api.getDesks(data[0].id).then(data => setSelectedFloorDesks(data))
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDesk = async (desk: Desk) => {
    setUpdating(desk.id);
    try {
      const updated = await api.updateDesk(desk.id, !desk.isEnabled);
      setSelectedFloorDesks((prev) =>
          prev ? prev.map((d) => (d.id === updated.id ? updated : d)) : null
      )
    } catch (error) {
      console.error('Failed to update desk:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const enabledCount = selectedFloorDesks?.filter((d) => d.isEnabled).length ?? 0;
  const totalCount = selectedFloorDesks?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={selectedFloor?.id ?? ''}
          onChange={(e) => {
            const floor = floors.find((f) => f.id === Number(e.target.value));
            setSelectedFloor(floor ?? null);
            if (floor) api.getDesks(floor.id).then(data => setSelectedFloorDesks(data));
            else setSelectedFloorDesks(null);
          }}
          className="border rounded-md px-3 py-2"
        >
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {selectedFloor && (
          <span className="text-gray-500 text-sm">
            {enabledCount}/{totalCount} desks enabled
          </span>
        )}
      </div>

      {selectedFloorDesks && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Desk</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {selectedFloorDesks.map((desk) => (
                <tr key={desk.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{desk.label}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        desk.isEnabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {desk.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleDesk(desk)}
                      disabled={updating === desk.id}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        desk.isEnabled
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {updating === desk.id
                        ? '...'
                        : desk.isEnabled
                        ? 'Disable'
                        : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
