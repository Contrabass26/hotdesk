import { useState } from 'react';
import type { Desk, Booking, Floor } from '../types';
import { buildDateTime } from '../utils/datetime';
import type { DeskScoreResponse } from '../services/api.ts';
import { Icon } from './ui/Icons';

interface FloorPlanProps {
    floor: Floor
    desks: Desk[];
    bookings: Booking[];
    selectedDate: string;
    startTime?: string;
    endTime?: string;
    onDeskSelect: (desk: Desk) => void;
    deskScores?: DeskScoreResponse;
    selectedDeskId?: number;
}

// MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) is the radius of markers in raw image space
const MARKER_RADIUS = 0.015;

type DeskStatus = "recommended" | "available" | "selected" | "booked" | "disabled";

export function FloorPlan({
    floor,
    desks,
    bookings,
    selectedDate,
    startTime,
    endTime,
    onDeskSelect,
    deskScores,
    selectedDeskId
}: FloorPlanProps) {
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

    const getRecommendedDeskId = (): number => {
        let bestId: number | undefined;
        let bestScore = Infinity;
        if (!deskScores) return -1;
        for (const key in deskScores) {
            const deskId = parseInt(key);
            const score = deskScores[deskId];
            if (score < bestScore) {
                bestScore = score;
                bestId = deskId;
            }
        }
        return bestId ?? -1;
    }
    const recommendedDeskId = getRecommendedDeskId();

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

        if (isBooked) return "booked";
        if (desk.id === selectedDeskId) return "selected";
        if (desk.id == recommendedDeskId) return "recommended";
        return "available";
    };

    const getDeskStyling = (status: DeskStatus): string => {
        switch (status) {
            case "recommended":
                return 'fill-[var(--kn-green)] stroke-white hover:fill-[var(--kn-green-700)] cursor-pointer drop-shadow-sm';
            case "available":
                return 'fill-[var(--kn-blue)] stroke-white hover:fill-[var(--kn-blue-700)] cursor-pointer drop-shadow-sm';
            case "selected":
                return 'fill-white stroke-[var(--kn-green)] cursor-pointer drop-shadow-sm';
            case "booked":
                return 'fill-slate-400 stroke-white cursor-not-allowed opacity-70';
            case "disabled":
                return 'fill-slate-300 stroke-white cursor-not-allowed opacity-70';
        }
    };

    return (
        <section className="kn-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[var(--kn-line)] p-4 md:flex-row md:items-center md:justify-between md:p-5">
                <div>
                    <div className="kn-section-title flex items-center gap-2">
                        <Icon name="map" className="h-5 w-5 text-[var(--kn-blue)]" />
                        {floor.name}
                    </div>
                    <p className="mt-1 text-sm font-medium text-[var(--kn-muted)]">
                        Select an available marker to reserve a desk for the chosen window.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                    {[
                        ['Best match', 'bg-[var(--kn-green)]'],
                        ['Available', 'bg-[var(--kn-blue)]'],
                        ['Selected', 'border-2 border-[var(--kn-green)] bg-white'],
                        ['Reserved', 'bg-slate-400'],
                    ].map(([label, color]) => (
                        <div key={label} className="kn-badge kn-badge-neutral">
                            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#f8fbfd] p-3 md:p-5">
                <div className="relative aspect-video min-h-[260px] overflow-hidden rounded-lg border border-[var(--kn-line)] bg-white shadow-inner">
                    {floor.image ? (
                        <img
                            src={floor.image}
                            ref={setImageElement}
                            id="image"
                            className="h-full w-full object-contain"
                            alt={`${floor.name} floor plan`}
                        />
                    ) : (
                        <div className="grid h-full place-items-center text-center">
                            <div>
                                <Icon name="floor" className="mx-auto h-10 w-10 text-[var(--kn-muted)]" />
                                <p className="mt-3 text-sm font-bold text-[var(--kn-muted)]">No floor plan image available</p>
                            </div>
                        </div>
                    )}

                    <svg
                        id="marker_svg"
                        viewBox={imageElement ? `0 0 ${imageElement.naturalWidth} ${imageElement.naturalHeight}` : "0 0 1 1"}
                        className="absolute inset-0 z-20 h-full w-full"
                    >
                        {(() => {
                            const r = imageElement ? MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) : 0;
                            return desks.map((desk) => {
                                const status = getDeskStatus(desk);
                                return (
                                    <circle
                                        className={getDeskStyling(status)}
                                        key={desk.id}
                                        cx={desk.xCoord}
                                        cy={desk.yCoord}
                                        r={r}
                                        strokeWidth={Math.max(r * 0.18, 1)}
                                        onClick={() => {
                                            if (status === "available" || status === "recommended" || status === "selected") {
                                                onDeskSelect(desk);
                                            }
                                        }}
                                    >
                                        <title>{`${desk.label}: ${status}`}</title>
                                    </circle>
                                )
                            })
                        })()}
                    </svg>
                </div>
            </div>
        </section>
    );
}
