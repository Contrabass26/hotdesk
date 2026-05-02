import {useState} from 'react';
import type {Desk, Booking, Floor} from '../types';
import {buildDateTime} from '../utils/datetime';

interface FloorPlanProps {
    floor: Floor
    desks: Desk[];
    bookings: Booking[];
    selectedDate: string;
    startTime?: string;
    endTime?: string;
    onDeskSelect: (desk: Desk) => void;
    selectedDeskId?: number;
    deskScores?: Record<number, number>;
}

// MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) is the radius of markers in raw image space
const MARKER_RADIUS = 0.015;

type DeskStatus = "available" | "booked" | "disabled";

export function FloorPlan({
                              floor,
                              desks,
                              bookings,
                              selectedDate,
                              startTime,
                              endTime,
                              onDeskSelect,
                              selectedDeskId,
                              deskScores = {}
                          }: FloorPlanProps) {
    const [hoveredDesk, setHoveredDesk] = useState<number | null>(null);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

    const getDeskStatus = (desk: Desk): DeskStatus => {
        if (!desk.isEnabled) return "disabled";
        if (!startTime || !endTime) return "available";
        // The time we're trying to book at
        const start = new Date(buildDateTime(selectedDate, startTime));
        const end = new Date(buildDateTime(selectedDate, endTime));

        const isBooked = bookings.some((booking) => {
            if (booking.deskId !== desk.id || booking.status !== 'confirmed') {
                return false;
            }

            // The existing booking
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);

            return (bookingStart < start) ? (bookingEnd > start) : (end > bookingStart);
        });

        return isBooked ? "booked" : "available";
    };

    const getDeskStyling = (status: DeskStatus): string => {
        switch (status) {
            case "available":
                return 'fill-green-500 hover:fill-green-600 cursor-pointer';
            case "booked":
                return 'fill-red-400 cursor-not-allowed';
            case "disabled":
                return 'fill-gray-300 cursor-not-allowed';
        }
    };

    const recommendedDeskId = Object.entries(deskScores).sort(
        ([, scoreA], [, scoreB]) => scoreA - scoreB
    )[0]?.[0];

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

            <div className="relative aspect-video min-h-0 overflow-hidden">
                {floor.image && (
                    <img src={floor.image} ref={setImageElement} id="image" className="w-full h-full object-contain"
                         alt="Floor Plan"/>)}

                <svg id="marker_svg"
                     viewBox={imageElement ? `0 0 ${imageElement.naturalWidth} ${imageElement.naturalHeight}` : "0 0 1 1"}
                     className="absolute inset-0 w-full h-full border rounded-md z-20">
                    {(() => {
                        const r = imageElement ? MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) : 0;
                        return desks.map((desk, index) => {
                            const status = getDeskStatus(desk);
                            return (
                                <circle
                                    className={getDeskStyling(status)}
                                    key={index}
                                    cx={desk.xCoord}
                                    cy={desk.yCoord}
                                    r={r}
                                    onClick={() => {
                                        if (status === "available") {
                                            onDeskSelect(desk);
                                        }
                                    }}
                                />
                            )
                        })
                    })()}
                </svg>
            </div>

            {hoveredDesk && (
                <div className="mt-2 text-sm text-gray-600">
                    Desk: {desks.find((d) => d.id === hoveredDesk)?.label}
                </div>
            )}
        </div>
    );
}
