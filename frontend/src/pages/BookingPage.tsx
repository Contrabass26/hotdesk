import {useEffect, useState} from 'react';
import {FloorPlan} from '../components/FloorPlan';
import {BookingModal} from '../components/BookingModal';
import {api} from '../services/api';
import type {Booking, Desk, Floor} from '../types';
import {useUser} from "../contexts/UserContext.tsx";
import { buildDateTime } from '../utils/datetime';

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
  const [deskScores, setDeskScores] = useState<Record<number, number>>({});
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    loadFloors();
  }, []);

  //when selected floor changes, load desks for that floor
  useEffect(() => {
    const loadFloorDesks = async () => {
      if (!selectedFloor) {
        setSelectedFloorDesks([]);
        return;
      }

      try {
        const desks = await api.getDesks(selectedFloor.id);
        setSelectedFloorDesks(desks);
      } catch (error) {
        console.error('Failed to load desks:', error);
        setSelectedFloorDesks([]);
      }
    };

    loadFloorDesks();
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedFloor) {
      loadBookings();
    }
  }, [selectedFloor, selectedDate]);

  useEffect(() => {
    if (selectedFloorDesks.length > 0) {
      loadRecommendations();
    } else {
      setDeskScores({});
    }
  }, [selectedFloorDesks, bookings, selectedDate, startTime, endTime, currentUser])

  const loadFloors = async () => {
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
  };

  const loadBookings = async () => {
    try {
      const data = await api.getBookings(selectedDate);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    }
  };

  const handleDeskSelect = (desk: Desk) => {
    setSelectedDesk(desk);
    setIsModalOpen(true);
  };

  const isDeskAvailableForTime = (desk: Desk) => {
    if (!desk.isEnabled) return false;

    const start = new Date(buildDateTime(selectedDate, startTime));
    const end = new Date(buildDateTime(selectedDate, endTime));

    return !bookings.some((booking) => {
      if (booking.deskId !== desk.id || booking.status !== 'confirmed') {
        return false;
      }

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return bookingStart < end && bookingEnd > start;
    });
  };

  const loadRecommendations = async () => {
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

    const availableDesks = selectedFloorDesks.filter(isDeskAvailableForTime);

    setScoring(true);

    try {
      const results = await Promise.allSettled(
        availableDesks.map(async (desk) => {
          const score = await api.scoreDesk({
            userId: currentUser.id,
            deskId: desk.id,
            startTime: startDateTime,
            endTime: endDateTime,
          });

          return { deskId: desk.id, score };
        })
      );

      const nextScores: Record<number, number> = {};

      for (const result of results) {
        if (result.status === 'fulfilled') {
          nextScores[result.value.deskId] = result.value.score;
        }
      }

      setDeskScores(nextScores);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setDeskScores({});
    } finally {
      setScoring(false);
    }
  };

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Book a Desk</h1>

        <div className="flex gap-4">
          <select
            value={selectedFloor?.id || ''}
            onChange={(e) => {
              const floor = floors.find((f) => f.id === Number(e.target.value));
              setSelectedFloor(floor || null);
            }}
            className="border rounded-md px-3 py-2"
          >
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="border rounded-md px-3 py-2"
          />

          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border rounded-md px-3 py-2"
          />

          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>

      {scoring && (
        <div className="text-sm text-gray-500 mb-2">
          Calculating desk recommendations...
        </div>
      )}

      {selectedFloor && (
        <FloorPlan
          desks={selectedFloorDesks}
          bookings={bookings}
          selectedDate={selectedDate}
          startTime={startTime}
          endTime={endTime}
          onDeskSelect={handleDeskSelect}
          selectedDeskId={selectedDesk?.id}
          deskScores={deskScores}
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
