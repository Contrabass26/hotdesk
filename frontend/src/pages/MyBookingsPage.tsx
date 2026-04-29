import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Booking } from '../types';
import {useUser} from "../contexts/UserContext.tsx";

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    if (currentUser != null) {
      try {
        const data = await api.getMyBookings(currentUser.id);
        setBookings(data);
      } catch (error) {
        console.error('Failed to load bookings:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.cancelBooking(id);
      loadBookings();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime) >= new Date() && b.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(
    (b) => new Date(b.startTime) < new Date() || b.status === 'cancelled'
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Upcoming ({upcomingBookings.length})
        </h2>

        {upcomingBookings.length === 0 ? (
          <p className="text-gray-500 py-4">No upcoming bookings</p>
        ) : (
          <div className="grid gap-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="border rounded-lg p-4 flex justify-between items-center bg-white"
              >
                <div>
                  <div className="font-medium">Desk {booking.deskId}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(booking.startTime)} •{' '}
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Past</h2>

        {pastBookings.length === 0 ? (
          <p className="text-gray-500 py-4">No past bookings</p>
        ) : (
          <div className="grid gap-3">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="border rounded-lg p-4 bg-gray-50 text-gray-500"
              >
                <div className="font-medium">
                  Desk {booking.deskId}
                  {booking.status === 'cancelled' && (
                    <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
                      Cancelled
                    </span>
                  )}
                  {booking.status === 'no_show' && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                      No Show
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  {formatDate(booking.startTime)} •{' '}
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
