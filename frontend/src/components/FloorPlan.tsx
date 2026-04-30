import { useState } from 'react';
import type { Desk, Booking } from '../types';
import { buildDateTime } from '../utils/datetime';

interface FloorPlanProps {
  desks: Desk[];
  bookings: Booking[];
  selectedDate: string;
  startTime?: string;
  endTime?: string;
  onDeskSelect: (desk: Desk) => void;
  selectedDeskId?: number;
  deskScores?: Record<number, number>;
}

export function FloorPlan({
    desks,
    bookings,
    selectedDate,
    startTime,
    endTime,
    onDeskSelect,
    selectedDeskId,
    deskScores={}}: FloorPlanProps) {
  const [hoveredDesk, setHoveredDesk] = useState<number | null>(null);

 const getDeskStatus = (desk: Desk): 'available' | 'booked' | 'disabled' => {
    if (!desk.isEnabled) return 'disabled';
    if (!startTime || !endTime) return 'available';
    const start = new Date(buildDateTime(selectedDate, startTime));
    const end = new Date(buildDateTime(selectedDate, endTime));

    console.log({
      desk: desk.id,
      bookings,
      start,
      end
    });
    const isBooked = bookings.some((booking) => {
      if (booking.deskId !== desk.id || booking.status !== 'confirmed') {
        return false;
      }

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      console.log({
        bookingDesk: booking.deskId,
        bookingStart,
        bookingEnd,
        overlap: bookingStart < end && bookingEnd > start
      });

      return bookingStart < end && bookingEnd > start;
    });

    return isBooked ? 'booked' : 'available';
  };

  const getDeskColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'fill-green-500 hover:fill-green-600 cursor-pointer';
      case 'booked':
        return 'fill-red-400 cursor-not-allowed';
      case 'disabled':
        return 'fill-gray-300 cursor-not-allowed';
      default:
        return 'fill-gray-300';
    }
  };

  const recommendedDeskId = Object.entries(deskScores).sort(
    ([, scoreA], [, scoreB]) => scoreA - scoreB
  )[0]?.[0];

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
          const isRecommended = status === 'available' && desk.id.toString() === recommendedDeskId;

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
                } ${
                  isRecommended ? 'stroke-yellow-400 stroke-[4px]' : ''
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
              {isRecommended && (
                <text
                  x={desk.xCoord * 60 + 25}
                  y={desk.yCoord * 60 + 42}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[9px] font-bold fill-white pointer-events-none select-none"
                >
                  BEST
                </text>
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
