import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Floor } from '../../types';
import { api } from '../../services/api';
import { Icon, type IconName } from '../../components/ui/Icons';

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
      setTodayBookings(bookingsData.filter(b => b.status !== 'cancelled').length);

      const predictionData = await api.getBookingPrediction(tomorrow);
      setTomorrowPrediction(predictionData);

      const stats = await Promise.all(floorsData.map(async (floor) => {
        const desks = await api.getDesks(floor.id);
        const totalDesks = desks.length;
        const enabledDesks = desks.filter((d) => d.isEnabled).length;
        const floorBookings = bookingsData.filter(
          (b) => desks.some((d) => d.id === b.deskId) && b.status !== 'cancelled'
        ).length;
        const occupancyPercent = enabledDesks > 0 ? Math.round((floorBookings / enabledDesks) * 100) : 0;

        return {
          floor,
          totalDesks,
          enabledDesks,
          todayBookings: floorBookings,
          occupancyPercent,
        };
      }));

      setFloorStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="kn-loading"><div className="kn-panel px-6 py-4">Loading dashboard...</div></div>;
  }

  const metricCards: Array<{
    label: string;
    value: string | number;
    icon: IconName;
    accent: 'blue' | 'green';
  }> = [
    { label: 'Today’s Bookings', value: todayBookings, icon: 'bookings', accent: 'green' },
    { label: 'Tomorrow’s Prediction', value: tomorrowPrediction, icon: 'spark', accent: 'blue' },
    {
      label: 'Total Desks',
      value: `${floorStats.reduce((sum, f) => sum + f.enabledDesks, 0)}/${floorStats.reduce((sum, f) => sum + f.totalDesks, 0)}`,
      icon: 'desk',
      accent: 'blue',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map(({ label, value, icon, accent }) => (
          <div key={label} className="kn-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.07em] text-[var(--kn-muted)]">{label}</div>
                <div className="mt-3 text-4xl font-black leading-none text-[var(--kn-ink)]">{value}</div>
              </div>
              <div className={accent === 'green' ? 'kn-icon-tile-soft' : 'kn-icon-tile'}>
                <Icon name={icon} className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="kn-panel p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="kn-section-title">Floor Occupancy</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Confirmed bookings against enabled capacity today.</p>
          </div>
          <span className="kn-badge kn-badge-blue">Live</span>
        </div>
        <div className="space-y-5">
          {floorStats.map((stat) => (
            <div key={stat.floor.id}>
              <div className="mb-2 flex justify-between gap-4">
                <span className="font-black text-[var(--kn-ink)]">{stat.floor.name}</span>
                <span className="text-sm font-bold text-[var(--kn-muted)]">
                  {stat.todayBookings}/{stat.enabledDesks} desks ({stat.occupancyPercent}%)
                </span>
              </div>
              <div className="kn-progress">
                <div
                  className="kn-progress-bar"
                  style={{ width: `${stat.occupancyPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kn-panel p-5 md:p-6">
        <h2 className="kn-section-title mb-4">Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/desks"
            className="kn-card group p-4 transition hover:-translate-y-0.5 hover:border-[var(--kn-blue)]"
          >
            <Icon name="desk" className="mb-4 h-5 w-5 text-[var(--kn-blue)]" />
            <div className="font-black text-[var(--kn-ink)]">Desk Management</div>
            <div className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Enable or disable desks per floor</div>
          </Link>

          <Link
            to="/admin/bookings"
            className="kn-card group p-4 transition hover:-translate-y-0.5 hover:border-[var(--kn-blue)]"
          >
            <Icon name="bookings" className="mb-4 h-5 w-5 text-[var(--kn-blue)]" />
            <div className="font-black text-[var(--kn-ink)]">All Bookings</div>
            <div className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">View and manage reservation status</div>
          </Link>

          <Link
            to="/admin/users"
            className="kn-card group p-4 transition hover:-translate-y-0.5 hover:border-[var(--kn-blue)]"
          >
            <Icon name="users" className="mb-4 h-5 w-5 text-[var(--kn-blue)]" />
            <div className="font-black text-[var(--kn-ink)]">User Management</div>
            <div className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Manage access and admin status</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
