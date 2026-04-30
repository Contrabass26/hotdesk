interface NewFloorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function NewFloorModal({isOpen, onClose, onConfirm}: NewFloorModalProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const onImageChosen = (e: FileList | null) => {
        if (e && e.length > 0) {
            const file = e[0];
            const reader = new FileReader();
            console.log('Loading image...')
            reader.onload = (event) => {
                console.log('Image loaded')
                if (event.target) {
                    const base64String = event.target.result as string;
                    const image = new Image();
                    image.src = base64String;
                    image.onload = () => {
                        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            const sf = canvas.width / image.width;
                            canvas.height = image.height * sf;
                            ctx.scale(sf, sf);
                            ctx.drawImage(image, 0, 0);
                        }
                    }
                }
            }
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">New Floor</h3>

                <div className="space-y-4">
                    <input type="file" id="floorPlan" name="floorPlan" accept="image/png" onChange={ (e) => onImageChosen(e.target.files) } className="file:mr-3 bg-gray-100 rounded-md px-3 py-2 file:text-white cursor-pointer file:bg-blue-600 hover:file:bg-blue-700 file:rounded-md file:px-3 file:py-1"/>

                    <canvas id="canvas" className="w-full h-56vw border rounded-md"></canvas>

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
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
