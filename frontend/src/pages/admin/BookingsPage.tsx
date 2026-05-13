import { useCallback, useEffect, useState } from 'react';
import type { Booking } from '../../types';
import { api } from '../../services/api';
import { Icon } from '../../components/ui/Icons';

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

  const loadBookings = useCallback(async () => {
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
  }, [endDate, startDate, statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

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
    <div className="space-y-5">
      <div className="kn-panel p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
          <label className="kn-label" htmlFor="bookings-start">From</label>
          <input
            id="bookings-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="kn-input"
          />
        </div>
        <div>
          <label className="kn-label" htmlFor="bookings-end">To</label>
          <input
            id="bookings-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="kn-input"
          />
        </div>
        <div>
          <label className="kn-label" htmlFor="bookings-status">Status</label>
        <select
            id="bookings-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
            className="kn-select"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        </div>
        <span className="kn-badge kn-badge-blue justify-center py-3">
          <Icon name="bookings" className="h-3.5 w-3.5" />
          {bookings.length} booking(s)
        </span>
        </div>
      </div>

      <div className="kn-panel overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm font-bold text-[var(--kn-muted)]">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="kn-empty m-5">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="kn-table min-w-[760px]">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Desk</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="text-[var(--kn-muted)]">#{b.id}</td>
                    <td className="font-bold">User {b.userId}</td>
                    <td>Desk {b.deskId}</td>
                    <td className="whitespace-nowrap">{formatDateTime(b.startTime)}</td>
                    <td className="whitespace-nowrap">{formatDateTime(b.endTime)}</td>
                    <td>
                      <span
                        className={`kn-badge ${b.status === 'confirmed'
                            ? 'kn-badge-green'
                            : b.status === 'cancelled'
                              ? 'kn-badge-red'
                              : 'kn-badge-amber'
                          }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          className="kn-button kn-button-danger"
                        >
                          <Icon name="close" />
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
