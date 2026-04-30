import {useEffect, useState} from 'react';
import {FloorPlan} from '../components/FloorPlan';
import {BookingModal} from '../components/BookingModal';
import {api} from '../services/api';
import type {Booking, Desk, Floor} from '../types';
import {useUser} from "../contexts/UserContext.tsx";

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

  const buildDateTime = (time: string) => {
    return `${selectedDate}T${time}:00Z`;
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

  const handleBookingConfirm = async () => {
    if (!selectedDesk) return;

    if (currentUser != null) {
      try {
        await api.createBooking({
          userId: currentUser.id,
          deskId: selectedDesk.id,
          startTime: buildDateTime(startTime),
          endTime: buildDateTime(endTime),
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

      {selectedFloor && (
        <FloorPlan
          desks={selectedFloorDesks}
          bookings={bookings}
          selectedDate={selectedDate}
          onDeskSelect={handleDeskSelect}
          selectedDeskId={selectedDesk?.id}
        />
      )}

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBookingConfirm}
        deskLabel={selectedDesk?.label || ''}
        selectedDate={selectedDate}
      />
    </div>
  );
}
