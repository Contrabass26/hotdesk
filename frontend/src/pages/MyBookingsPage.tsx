import { useCallback, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Booking } from '../types';
import { useUser } from "../contexts/useUser";
import { Icon } from '../components/ui/Icons';

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  const loadBookings = useCallback(async () => {
    if (currentUser != null) {
      try {
        const data = await api.getMyBookings(currentUser.id);
        setBookings(data);
      } catch (error) {
        console.error('Failed to load bookings:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.cancelBooking(id);
      void loadBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="kn-loading">
        <div className="kn-panel px-6 py-4">Loading your bookings...</div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.endTime) >= new Date() && b.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(
    (b) => new Date(b.endTime) < new Date() || b.status === 'cancelled'
  );

  return (
    <div className="space-y-6">
      <div className="kn-page-header">
        <div>
          <h1 className="kn-page-title">My Bookings</h1>
          <p className="kn-page-copy">Review upcoming reservations and keep your workday seating tidy.</p>
        </div>
        <div className="kn-card flex min-w-[190px] items-center gap-3 p-4">
          <div className="kn-icon-tile">
            <Icon name="calendar" className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black leading-none text-[var(--kn-ink)]">{upcomingBookings.length}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.07em] text-[var(--kn-muted)]">Upcoming</div>
          </div>
        </div>
      </div>

      <section className="kn-panel overflow-hidden">
        <div className="border-b border-[var(--kn-line)] px-5 py-4">
          <h2 className="kn-section-title">Upcoming ({upcomingBookings.length})</h2>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="kn-empty m-5">
            <Icon name="bookings" className="mx-auto h-8 w-8 text-[var(--kn-muted)]" />
            <p className="mt-3 font-bold">No upcoming bookings</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--kn-line)]">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="kn-icon-tile-soft">
                    <Icon name="desk" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-[var(--kn-ink)]">Desk {booking.deskId}</div>
                    <div className="truncate text-sm font-semibold text-[var(--kn-muted)]">
                    {formatDate(booking.startTime)} •{' '}
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="kn-button kn-button-danger shrink-0"
                >
                  <Icon name="close" />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="kn-panel overflow-hidden">
        <div className="border-b border-[var(--kn-line)] px-5 py-4">
          <h2 className="kn-section-title">Past</h2>
        </div>

        {pastBookings.length === 0 ? (
          <div className="kn-empty m-5">No past bookings</div>
        ) : (
          <div className="divide-y divide-[var(--kn-line)]">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-2 bg-[#fbfdff] p-5 text-[var(--kn-muted)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-black text-[var(--kn-ink)]">
                    Desk {booking.deskId}
                  </div>
                  <div className="text-sm font-semibold">
                    {formatDate(booking.startTime)} •{' '}
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </div>
                </div>
                {booking.status === 'cancelled' && (
                  <span className="kn-badge kn-badge-neutral">Cancelled</span>
                )}
                {booking.status === 'no_show' && (
                  <span className="kn-badge kn-badge-amber">No Show</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
