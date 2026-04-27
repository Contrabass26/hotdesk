import { useState } from 'react';
import type { Desk, Booking } from '../types';

interface FloorPlanProps {
  desks: Desk[];
  bookings: Booking[];
  selectedDate: string;
  onDeskSelect: (desk: Desk) => void;
  selectedDeskId?: number;
}

export function FloorPlan({ desks, bookings, selectedDate, onDeskSelect, selectedDeskId }: FloorPlanProps) {
  const [hoveredDesk, setHoveredDesk] = useState<number | null>(null);

  const getDeskStatus = (desk: Desk): 'available' | 'booked' | 'disabled' => {
    if (!desk.isEnabled) return 'disabled';

    const deskBookings = bookings.filter(
      (b) =>
        b.deskId === desk.id &&
        b.status === 'confirmed' &&
        isBookingOnDate(b, selectedDate)
    );

    return deskBookings.length > 0 ? 'booked' : 'available';
  };

  const isBookingOnDate = (booking: Booking, date: string): boolean => {
    const bookingDate = new Date(booking.startTime).toDateString();
    const selectedDateObj = new Date(date).toDateString();
    return bookingDate === selectedDateObj;
  };

  const getDeskColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 cursor-pointer';
      case 'booked':
        return 'bg-red-400 cursor-not-allowed';
      case 'disabled':
        return 'bg-gray-300 cursor-not-allowed';
      default:
        return 'bg-gray-300';
    }
  };

  const maxX = Math.max(...desks.map((d) => d.xCoord), 1);
  const maxY = Math.max(...desks.map((d) => d.yCoord), 1);

  const viewBoxWidth = (maxX + 2) * 60;
  const viewBoxHeight = (maxY + 2) * 60;

  return (
    <div className="relative bg-gray-100 rounded-lg p-4 overflow-auto">
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-400"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-300"></div>
          <span>Disabled</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full max-w-3xl mx-auto"
        style={{ minHeight: '300px' }}
      >
        {desks.map((desk) => {
          const status = getDeskStatus(desk);
          const isSelected = desk.id === selectedDeskId;
          const isHovered = desk.id === hoveredDesk;

          return (
            <g key={desk.id}>
              <rect
                x={desk.xCoord * 60}
                y={desk.yCoord * 60}
                width={50}
                height={50}
                rx={8}
                className={`${getDeskColor(status)} ${
                  isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                } transition-all duration-150`}
                onClick={() => status === 'available' && onDeskSelect(desk)}
                onMouseEnter={() => setHoveredDesk(desk.id)}
                onMouseLeave={() => setHoveredDesk(null)}
              />
              <text
                x={desk.xCoord * 60 + 25}
                y={desk.yCoord * 60 + 30}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-white pointer-events-none select-none"
              >
                {desk.label}
              </text>
              {isHovered && status === 'available' && (
                <rect
                  x={desk.xCoord * 60 - 2}
                  y={desk.yCoord * 60 - 2}
                  width={54}
                  height={54}
                  rx={10}
                  fill="none"
                  stroke="#1e40af"
                  strokeWidth={2}
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}
      </svg>

      {hoveredDesk && (
        <div className="mt-2 text-sm text-gray-600">
          Desk: {desks.find((d) => d.id === hoveredDesk)?.label}
        </div>
      )}
    </div>
  );
}
