import { useState } from "react";

interface NewFloorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, image: string, markers: DeskMarker[]) => void;
}

type DeskMarker = { x: number, y: number };

// MARKER_RADIUS * Math.min(imageElement.naturalWidth, imageElement.naturalHeight) is the radius of markers in raw image space
const MARKER_RADIUS = 0.015;

export function NewFloorModal({ isOpen, onClose, onConfirm }: NewFloorModalProps) {
    const [image, setImage] = useState<string | null>(null);
    const [deskMarkers, setDeskMarkers] = useState<DeskMarker[]>([]);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const name = (document.getElementById('name') as HTMLInputElement).value;
        if (!image || name === "") return;
        onConfirm(name, image, deskMarkers);
        setDeskMarkers([]);
        setImage(null);
        onClose();
    };

    const handleCancel = () => {
        setDeskMarkers([]);
        setImage(null);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 min-h-0 flex-col">
            <div className="bg-white rounded-lg p-6 w-full max-w-[90vw] max-h-[90vh] mx-4 shadow-xl flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-1">New Floor</h3>
                <p className="mb-3">Choose a name, upload a floor plan, then click to add/remove desks.</p>

                <div className="space-y-4 min-h-0 flex flex-col">
                    <input type="text" id="name" name="name" placeholder="My new floor" className="border rounded-md px-3 py-2 w-full" />
                    <input type="file" id="floorPlan" name="floorPlan" accept="image/png" onChange={(e) => onImageChosen(e.target.files)} className="file:mr-3 bg-gray-100 rounded-md px-3 py-2 file:text-white cursor-pointer file:bg-blue-600 hover:file:bg-blue-700 file:rounded-md file:px-3 file:py-1" />

                    <div className="relative aspect-video min-h-0 overflow-hidden">
                        {image && (<img src={image} ref={setImageElement} id="image" className="w-full h-full object-contain" alt="Floor Plan" />)}

                        <svg id="marker_svg" viewBox={imageElement ? `0 0 ${imageElement.naturalWidth} ${imageElement.naturalHeight}` : "0 0 1 1"} className="absolute inset-0 w-full h-full border rounded-md z-20" onClick={e => {
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
                                        fill="red"
                                    />
                                ))
                            })()}
                        </svg>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
