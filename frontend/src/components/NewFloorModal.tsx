import { useState } from "react";
import { Icon } from "./ui/Icons";

interface NewFloorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, image: string, markers: DeskMarker[]) => void;
}

type DeskMarker = { x: number, y: number };

// MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) is the radius of markers in raw image space
const MARKER_RADIUS = 0.015;

export function NewFloorModal({ isOpen, onClose, onConfirm }: NewFloorModalProps) {
    const [name, setName] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [deskMarkers, setDeskMarkers] = useState<DeskMarker[]>([]);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!image || name === "") return;
        onConfirm(name, image, deskMarkers);
        setDeskMarkers([]);
        setImage(null);
        setName("");
        onClose();
    };

    const handleCancel = () => {
        setDeskMarkers([]);
        setImage(null);
        setName("");
        onClose();
    }

    const onImageChosen = (e: FileList | null) => {
        if (e && e.length > 0) {
            const file = e[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target) {
                    setImage(event.target.result as string);
                    setDeskMarkers([])
                }
            }
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = (xClick: number, yClick: number) => {
        if (!imageElement) return;
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

        // Check whether there's already a marker near here
        let existingMarker: DeskMarker | undefined;
        const r = MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight);
        const rSquared = r * r;
        for (const marker of deskMarkers) {
            const dx = x - marker.x;
            const dy = y - marker.y;
            if (dx * dx + dy * dy < rSquared) {
                existingMarker = marker;
                break;
            }
        }

        // If there is, remove it
        if (existingMarker) {
            setDeskMarkers(deskMarkers.filter(m => m !== existingMarker));
        } else {
            // Otherwise, add a new one
            setDeskMarkers([...deskMarkers, { x, y }]);
        }
    }

    // Expects x and y in raw canvas space
    return (
        <div className="kn-modal-backdrop min-h-0 flex-col">
            <div className="kn-modal kn-fade-in flex min-h-0 w-full max-w-[980px] flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--kn-line)] px-6 py-5">
                    <div>
                        <h3 className="text-xl font-black text-[var(--kn-ink)]">New Floor</h3>
                        <p className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Choose a name, upload a floor plan, then click to add or remove desks.</p>
                    </div>
                    <button className="kn-icon-button h-9 w-9" onClick={handleCancel} aria-label="Close floor dialog">
                        <Icon name="close" className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex min-h-0 flex-col space-y-4 px-6 py-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                        <div>
                            <label className="kn-label" htmlFor="name">Floor name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Headquarters Level 4"
                                className="kn-input"
                            />
                        </div>
                        <div>
                            <label className="kn-label" htmlFor="floorPlan">Floor plan</label>
                            <input
                                type="file"
                                id="floorPlan"
                                name="floorPlan"
                                accept="image/png, image/jpeg"
                                onChange={(e) => onImageChosen(e.target.files)}
                                className="kn-input file:mr-3 file:rounded-md file:border-0 file:bg-[var(--kn-blue)] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
                            />
                        </div>
                    </div>

                    <div className="relative aspect-video min-h-[260px] overflow-hidden rounded-lg border border-[var(--kn-line)] bg-[#f8fbfd]">
                        {image ? (
                            <img src={image} ref={setImageElement} id="image" className="h-full w-full object-contain" alt="Floor Plan" />
                        ) : (
                            <div className="grid h-full place-items-center text-center">
                                <div>
                                    <Icon name="floor" className="mx-auto h-10 w-10 text-[var(--kn-muted)]" />
                                    <p className="mt-3 text-sm font-bold text-[var(--kn-muted)]">Upload a floor plan to start placing desks.</p>
                                </div>
                            </div>
                        )}

                        <svg id="marker_svg" viewBox={imageElement ? `0 0 ${imageElement.naturalWidth} ${imageElement.naturalHeight}` : "0 0 1 1"} className="absolute inset-0 z-20 h-full w-full" onClick={e => {
                            handleImageClick(e.clientX, e.clientY);
                        }}>
                            {(() => {
                                const r = imageElement ? MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) : 0;
                                return deskMarkers.map((marker, index) => (
                                    <circle
                                        key={index}
                                        cx={marker.x}
                                        cy={marker.y}
                                        r={r}
                                        className="fill-[var(--kn-cyan)] stroke-white drop-shadow-sm"
                                        strokeWidth={Math.max(r * 0.18, 1)}
                                    />
                                ))
                            })()}
                        </svg>
                    </div>

                    <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                        <span className="kn-badge kn-badge-blue self-start">
                            <Icon name="desk" className="h-3.5 w-3.5" />
                            {deskMarkers.length} desk marker(s)
                        </span>
                        <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCancel}
                                className="kn-button kn-button-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                                className="kn-button kn-button-primary"
                        >
                                <Icon name="check" />
                            Create
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
