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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">New Floor</h3>

                <div className="space-y-4">
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
