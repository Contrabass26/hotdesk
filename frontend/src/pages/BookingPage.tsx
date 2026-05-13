import { useCallback, useEffect, useState } from 'react';
import { FloorPlan } from '../components/FloorPlan';
import { BookingModal } from '../components/BookingModal';
import { api, type DeskScoreResponse } from '../services/api';
import type { Booking, Desk, Floor } from '../types';
import { useUser } from "../contexts/useUser";
import { buildDateTime } from '../utils/datetime';
import { Icon } from '../components/ui/Icons';

export function BookingPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedFloorDesks, setSelectedFloorDesks] = useState<Desk[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const { currentUser } = useUser()
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [deskScores, setDeskScores] = useState<DeskScoreResponse>({});
  const [scoring, setScoring] = useState(false);

  const loadFloors = useCallback(async () => {
    try {
      const data = await api.getFloors();
      setFloors(data);
      if (data.length > 0) {
        const floor = data[0];
        setSelectedFloor(floor);
      }
    } catch (error) {
      console.error('Failed to load floors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const data = await api.getBookings(selectedDate);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    }
  }, [selectedDate]);

  const loadRecommendations = useCallback(async () => {
    if (!currentUser) {
      setDeskScores({});
      return;
    }

    const startDateTime = buildDateTime(selectedDate, startTime);
    const endDateTime = buildDateTime(selectedDate, endTime);

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setDeskScores({});
      return;
    }

    if (selectedFloor) {
      setScoring(true);

      try {
        const nextScores = await api.scoreDesks({
          userId: currentUser.id,
          floorId: selectedFloor.id,
          startTime: startDateTime,
          endTime: endDateTime,
        });
        setDeskScores(nextScores);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setDeskScores({});
      } finally {
        setScoring(false);
      }
    }
  }, [currentUser, endTime, selectedDate, selectedFloor, startTime]);

  useEffect(() => {
    void loadFloors();
  }, [loadFloors]);

  useEffect(() => {
    let ignore = false;

    const loadFloorDesks = async () => {
      if (!selectedFloor) {
        setSelectedFloorDesks([]);
        return;
      }

      try {
        const desks = await api.getDesks(selectedFloor.id);
        if (!ignore) setSelectedFloorDesks(desks);
      } catch (error) {
        console.error('Failed to load desks:', error);
        if (!ignore) setSelectedFloorDesks([]);
      }
    };

    void loadFloorDesks();
    return () => {
      ignore = true;
    };
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedFloor) {
      void loadBookings();
    }
  }, [loadBookings, selectedFloor]);

  useEffect(() => {
    if (selectedFloorDesks.length > 0 && currentUser?.teamId) {
      void loadRecommendations();
    } else {
      setDeskScores({});
    }
  }, [bookings, currentUser?.teamId, loadRecommendations, selectedFloorDesks]);

  const handleDeskSelect = (desk: Desk) => {
    setSelectedDesk(desk);
    setIsModalOpen(true);
  };

  const isBookingWindowValid = new Date(buildDateTime(selectedDate, startTime)) < new Date(buildDateTime(selectedDate, endTime));

  const handleBookingConfirm = async () => {
    if (!selectedDesk) return;

    if (currentUser != null) {
      try {
        await api.createBooking({
          userId: currentUser.id,
          deskId: selectedDesk.id,
          startTime: buildDateTime(selectedDate, startTime),
          endTime: buildDateTime(selectedDate, endTime),
        });

        await loadBookings();
        setIsModalOpen(false);
        setSelectedDesk(null);
      } catch (error) {
        console.error('Failed to create booking:', error);
        alert('Failed to create booking. Please try again.');
      }
    } else {
      console.error('Failed to create booking: no user selected')
      alert('Failed to create booking: no user selected')
    }
  };

  if (loading) {
    return (
      <div className="kn-loading">
        <div className="kn-panel px-6 py-4">Loading floor availability...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="kn-page-header">
        <div>
          <h1 className="kn-page-title">Book a Desk</h1>
          <p className="kn-page-copy">
            Choose a floor and time window, then select a desk from the plan.
          </p>
        </div>
      </div>

      <section className="kn-panel p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <label className="kn-label" htmlFor="floor">Floor</label>
            <select
              id="floor"
              value={selectedFloor?.id || ''}
              onChange={(e) => {
                const floor = floors.find((f) => f.id === Number(e.target.value));
                setSelectedFloor(floor || null);
              }}
              className="kn-select"
            >
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="kn-label" htmlFor="booking-date">Date</label>
            <input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="kn-input"
            />
          </div>

          <div>
            <label className="kn-label" htmlFor="start-time">Start</label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="kn-input"
            />
          </div>

          <div>
            <label className="kn-label" htmlFor="end-time">End</label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="kn-input"
            />
          </div>
        </div>
      </section>

      {scoring && (
        <div className="kn-panel-quiet flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--kn-muted)]">
          <Icon name="spark" className="h-4 w-4 text-[var(--kn-blue)]" />
          Calculating desk recommendations...
        </div>
      )}

      {!isBookingWindowValid && (
        <div className="rounded-lg bg-[var(--kn-amber-soft)] px-4 py-3 text-sm font-bold text-[var(--kn-amber)]">
          End time must be after start time before recommendations can run.
        </div>
      )}

      {selectedFloor && (
        <FloorPlan
          floor={selectedFloor}
          desks={selectedFloorDesks}
          bookings={bookings}
          selectedDate={selectedDate}
          startTime={startTime}
          endTime={endTime}
          onDeskSelect={handleDeskSelect}
          deskScores={deskScores}
          selectedDeskId={selectedDesk?.id}
        />
      )}

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDesk(null);
        }}
        onConfirm={handleBookingConfirm}
        deskLabel={selectedDesk?.label || ''}
        selectedDate={selectedDate}
        startTime={startTime}
        endTime={endTime}
      />
    </div>
  );
}
