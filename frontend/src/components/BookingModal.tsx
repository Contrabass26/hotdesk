import { useState } from 'react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
  deskLabel: string;
  selectedDate: string;
}

export function BookingModal({
  isOpen,
  onClose,
  onConfirm,
  deskLabel,
  selectedDate,
}: BookingModalProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const startDateTime = `${selectedDate}T${startTime}:00+00:00`;
    const endDateTime = `${selectedDate}T${endTime}:00+00:00`;
    onConfirm(startDateTime, endDateTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Book Desk {deskLabel}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              readOnly
              className="w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
