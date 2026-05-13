import { useEffect, useState } from 'react';
import type { Floor, Desk } from '../../types';
import { api } from '../../services/api';
import { Icon } from '../../components/ui/Icons';

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
        if (data.length > 0) {
          setSelectedFloor(data[0]);
          api.getDesks(data[0].id).then(setSelectedFloorDesks);
        } else {
          setSelectedFloorDesks([]);
        }
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

  if (loading) return <div className="kn-loading"><div className="kn-panel px-6 py-4">Loading desks...</div></div>;

  const enabledCount = selectedFloorDesks?.filter((d) => d.isEnabled).length ?? 0;
  const totalCount = selectedFloorDesks?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="kn-panel p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm">
            <label className="kn-label" htmlFor="desk-floor">Floor</label>
            <select
              id="desk-floor"
              value={selectedFloor?.id ?? ''}
              onChange={(e) => {
                const floor = floors.find((f) => f.id === Number(e.target.value));
                setSelectedFloor(floor ?? null);
                if (floor) api.getDesks(floor.id).then(data => setSelectedFloorDesks(data));
                else setSelectedFloorDesks(null);
              }}
              className="kn-select"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          {selectedFloor && (
            <div className="kn-badge kn-badge-blue self-start md:self-auto">
              <Icon name="desk" className="h-3.5 w-3.5" />
              {enabledCount}/{totalCount} desks enabled
            </div>
          )}
        </div>
      </div>

      {selectedFloorDesks && (
        <div className="kn-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="kn-table min-w-[460px]">
              <thead>
                <tr>
                  <th>Desk</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedFloorDesks.map((desk) => (
                  <tr key={desk.id}>
                    <td className="font-black">
                      <div className="flex items-center gap-3">
                        <span className="kn-icon-tile">
                          <Icon name="desk" className="h-4 w-4" />
                        </span>
                        {desk.label}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`kn-badge ${desk.isEnabled
                          ? 'kn-badge-green'
                          : 'kn-badge-neutral'
                          }`}
                      >
                        {desk.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleToggleDesk(desk)}
                        disabled={updating === desk.id}
                        className={`kn-button ${desk.isEnabled ? 'kn-button-danger' : 'kn-button-success'}`}
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
