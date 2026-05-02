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

    const getDeskStatus = (desk: Desk): 'available' | 'booked' | 'disabled' => {
        if (!desk.isEnabled) return 'disabled';
        if (!startTime || !endTime) return 'available';
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

    const handleImageClick = (xClick: number, yClick: number) => {
        console.log(floor.image)
        if (!imageElement) return;
        // Get the click location in raw image space
        const bounds = imageElement.getBoundingClientRect();

        // Display space is actual space on the screen, relative to the container
        // Raw image space is virtual space in the image

        // Scale factor from raw image space to display space
        const ris2ds = Math.min(
            bounds.width / imageElement.naturalWidth,
            bounds.height / imageElement.naturalHeight
        );

        // The size (in display space) that the image is currently occupying
        const displayWidth = imageElement.naturalWidth * ris2ds;
        const displayHeight = imageElement.naturalHeight * ris2ds;

        // The current position (in display space) of the image
        // This is not generally (0,0) because the image gets letterboxed to preserve aspect ratio
        const displayX = (bounds.width - displayWidth) / 2;
        const displayY = (bounds.height - displayHeight) / 2;

        // Convert click position (display space) to raw image space
        // The event's click position is relative to the whole viewport, not just the container
        const x = (xClick - bounds.left - displayX) / ris2ds;
        const y = (yClick - bounds.top - displayY) / ris2ds;

        // Ignore clicks that are in the box but not in the image (due to letterboxing)
        if (x < 0 || y < 0 || x > imageElement.naturalWidth || y > imageElement.naturalHeight) {
            return;
        }

        // Find the closest desk
        const r = MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight);
        const rSquared = r * r;
        let closestDesk: Desk | undefined;
        let closestSquaredDistance = rSquared;
        for (const desk of desks) {
            const dx = x - desk.xCoord;
            const dy = y - desk.yCoord;
            const squaredDistance = dx * dx + dy * dy;
            if (squaredDistance < closestSquaredDistance) {
                closestDesk = desk;
                closestSquaredDistance = squaredDistance;
            }
        }
        if (closestDesk) {
            onDeskSelect(closestDesk);
        }
    }

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
                     className="absolute inset-0 w-full h-full border rounded-md z-20" onClick={e => {
                    handleImageClick(e.clientX, e.clientY);
                }}>
                    {(() => {
                        const r = imageElement ? MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) : 0;
                        return desks.map((desk, index) => (
                            <circle
                                key={index}
                                cx={desk.xCoord}
                                cy={desk.yCoord}
                                r={r}
                                fill="red"
                            />
                        ))
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
