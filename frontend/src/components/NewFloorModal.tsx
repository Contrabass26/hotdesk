import {useEffect, useState} from "react";

interface NewFloorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, markers: DeskMarker[]) => void;
}

type DeskMarker = {x: number, y: number};

const MARKER_RADIUS = 10;

export function NewFloorModal({isOpen, onClose, onConfirm}: NewFloorModalProps) {
    const [image, setImage] = useState<string | null>(null);
    const [deskMarkers, setDeskMarkers] = useState<DeskMarker[]>([]);

    // When a new image is chosen, reset the canvas - otherwise we might see the old image underneath
    useEffect(() => {
        const maybeCanvas = document.getElementById('canvas');
        if (!maybeCanvas) return;
        const canvas = maybeCanvas as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.reset();
        }
    }, [image])

    // When the image or desk markers change, redraw the image and markers
    useEffect(() => {
        const maybeCanvas = document.getElementById('canvas');
        if (!maybeCanvas) return;
        const canvas = maybeCanvas as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (ctx && image) {
            // Reset the transform (but don't clear it - avoids stutter)
            ctx.resetTransform();
            // Draw the image
            const img = new Image();
            img.src = image;
            img.onload = () => {
                const bounds = canvas.getBoundingClientRect();
                // Get scale factor from image space to scaled canvas space
                const is2scs = Math.min(bounds.width / img.width, bounds.height / img.height);
                // Get scale factors from scaled canvas space to raw canvas space
                const scs2rcs_x = canvas.width / bounds.width;
                const scs2rcs_y = canvas.height / bounds.height;
                // And therefore, get the desired image size in raw canvas space
                const width = img.width * is2scs;
                const height = img.height * is2scs;
                ctx.scale(scs2rcs_x, scs2rcs_y);
                ctx.drawImage(img, 0, 0, width, height);
                // Now draw the desk markers
                deskMarkers.forEach(({x, y}: DeskMarker) => {
                    ctx.beginPath();
                    ctx.arc(x / scs2rcs_x, y / scs2rcs_y, MARKER_RADIUS, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                })
            }
        }
    }, [image, deskMarkers])

    if (!isOpen) return null;

    const handleConfirm = () => {
        const name = (document.getElementById('name') as HTMLInputElement).value;
        onConfirm(name, deskMarkers);
        onClose();
    };

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

    // Expects x and y in raw canvas space
    const onCanvasClick = (x: number, y: number) => {
        // Check whether there's already a marker near here
        let existingMarker: DeskMarker | undefined;
        for (const marker of deskMarkers) {
            const dx = x - marker.x;
            const dy = y - marker.y;
            if (dx * dx + dy * dy < MARKER_RADIUS * MARKER_RADIUS) {
                existingMarker = marker;
                break;
            }
        }

        // If there is, remove it
        if (existingMarker) {
            setDeskMarkers(deskMarkers.filter(m => m !== existingMarker));
        } else {
            // Otherwise, add a new one
            setDeskMarkers([...deskMarkers, {x, y}]);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 min-h-0 flex-col">
            <div className="bg-white rounded-lg p-6 w-full max-w-[90vw] max-h-[90vh] mx-4 shadow-xl flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-1">New Floor</h3>
                <p className="mb-3">Choose a name, upload a floor plan, then click to add/remove desks.</p>

                <div className="space-y-4 min-h-0 flex flex-col">
                    <input type="text" id="name" name="name" placeholder="My new floor" className="border rounded-md px-3 py-2 w-full"/>
                    <input type="file" id="floorPlan" name="floorPlan" accept="image/png" onChange={ (e) => onImageChosen(e.target.files) } className="file:mr-3 bg-gray-100 rounded-md px-3 py-2 file:text-white cursor-pointer file:bg-blue-600 hover:file:bg-blue-700 file:rounded-md file:px-3 file:py-1"/>

                    <div className="min-h-0 overflow-hidden">
                        <canvas id="canvas" width="1920" height="1080" className="w-full h-full border rounded-md" onClick={ e => {
                            const canvas = e.target as HTMLCanvasElement;
                            const bounds = canvas.getBoundingClientRect();
                            onCanvasClick(
                                (e.clientX - bounds.left) * (canvas.width / bounds.width),
                                (e.clientY - bounds.top) * (canvas.height / bounds.height)
                            )
                        }}></canvas>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
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
