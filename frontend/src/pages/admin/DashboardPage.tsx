import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Floor } from '../../types';
import { api } from '../../services/api';

interface FloorStats {
  floor: Floor;
  totalDesks: number;
  enabledDesks: number;
  todayBookings: number;
  occupancyPercent: number;
}

export function DashboardPage() {
  const [floorStats, setFloorStats] = useState<FloorStats[]>([]);
  const [todayBookings, setTodayBookings] = useState(0);
  const [tomorrowPrediction, setTomorrowPrediction] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const floorsData = await api.getFloors();

      const bookingsData = await api.getBookings(today);
      setTodayBookings(bookingsData.length);

      const predictionData = await api.getBookingPrediction(tomorrow);
      setTomorrowPrediction(predictionData);

      const stats = []
      for (let i = 0; i < floorsData.length; i++) {
        const floor = floorsData[i];
        const desks = await api.getDesks(floor.id);
        const totalDesks = desks.length;
        const enabledDesks = desks.filter((d) => d.isEnabled).length;
        const floorBookings = bookingsData.filter(
            (b) => desks.some((d) => d.id === b.deskId)
        ).length;
        const occupancyPercent = enabledDesks > 0 ? Math.round((floorBookings / enabledDesks) * 100) : 0;

        stats.push({
          floor,
          totalDesks,
          enabledDesks,
          todayBookings: floorBookings,
          occupancyPercent,
        });
      }

      setFloorStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Today's Bookings</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{todayBookings}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Tomorrow's Prediction</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{tomorrowPrediction}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Desks</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {floorStats.reduce((sum, f) => sum + f.enabledDesks, 0)}/
            {floorStats.reduce((sum, f) => sum + f.totalDesks, 0)}
          </div>
        </div>
      </div>

      {/* Floor Occupancy */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Floor Occupancy (Today)</h2>
        <div className="space-y-4">
          {floorStats.map((stat) => (
            <div key={stat.floor.id}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">{stat.floor.name}</span>
                <span className="text-gray-600">
                  {stat.todayBookings}/{stat.enabledDesks} desks ({stat.occupancyPercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stat.occupancyPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/desks"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">Desk Management</div>
            <div className="text-sm text-gray-500 mt-1">Enable/disable desks per floor</div>
          </Link>

          <Link
            to="/admin/bookings"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">All Bookings</div>
            <div className="text-sm text-gray-500 mt-1">View and manage all bookings</div>
          </Link>

          <Link
            to="/admin/users"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">User Management</div>
            <div className="text-sm text-gray-500 mt-1">Manage users and admin status</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
