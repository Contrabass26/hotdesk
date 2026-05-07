import { useEffect, useState } from 'react';
import type { Booking } from '../../types';
import { api } from '../../services/api';

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>('confirmed');

  useEffect(() => {
    loadBookings();
  }, [startDate, endDate, statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getAllBookings({
        startDate,
        endDate,
        status: statusFilter || undefined,
      });
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await api.cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b))
      );
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancelling(null);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        <span className="text-sm text-gray-500">{bookings.length} booking(s)</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500 text-sm">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Desk</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">End</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{b.id}</td>
                    <td className="px-4 py-3">User {b.userId}</td>
                    <td className="px-4 py-3">Desk {b.deskId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(b.startTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(b.endTime)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'cancelled'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          {cancelling === b.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
