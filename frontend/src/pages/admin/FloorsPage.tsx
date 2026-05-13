import { useEffect, useState } from "react";
import { api } from "../../services/api.ts";
import type { Floor } from "../../types";
import { NewFloorModal } from "../../components/NewFloorModal.tsx";
import { Icon } from "../../components/ui/Icons.tsx";

export function FloorsPage() {
    const [loading, setLoading] = useState(true);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadFloors();
    }, []);

    const loadFloors = async () => {
        setLoading(true);
        try {
            const data = await api.getFloors()
            setFloors(data);
        } catch (error) {
            console.error('Failed to load floors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleting(id);
        try {
            await api.deleteFloor(id);
            setFloors((prev) =>
                prev.filter(f => f.id !== id)
            );
        } catch (error) {
            console.error('Failed to delete floor:', error);
        } finally {
            setDeleting(null);
        }
    };

    const handleNewFloorConfirm = (name: string, image: string, markers: { x: number, y: number }[]) => {
        // Create the actual floor
        api.createFloor(name, image).then(f => {
            // Add all the desks
            let i = 1
            markers.forEach(({ x, y }) => {
                const label = `Desk ${i}`
                api.createDesk(f.id, label, x, y);
                i++;
            })
            // Update our list of floors
            setFloors((prev) => [...prev, f]);
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="kn-section-title">Floors</h2>
                    <p className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Upload floor plans and place desk markers with precise map coordinates.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="kn-button kn-button-primary self-start sm:self-auto"
                >
                    <Icon name="plus" />
                    New Floor
                </button>
            </div>

            <div className="kn-panel overflow-hidden">
                {loading ? (
                    <div className="p-6 text-sm font-bold text-[var(--kn-muted)]">Loading...</div>
                ) : floors.length === 0 ? (
                    <div className="kn-empty m-5">No floors found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="kn-table min-w-[460px]">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {floors.map((f) => (
                                    <tr key={f.id}>
                                        <td className="text-[var(--kn-muted)]">#{f.id}</td>
                                        <td className="font-black">
                                            <div className="flex items-center gap-3">
                                                <span className="kn-icon-tile">
                                                    <Icon name="floor" className="h-4 w-4" />
                                                </span>
                                                {f.name}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => handleDelete(f.id)}
                                                disabled={deleting === f.id}
                                                className="kn-button kn-button-danger"
                                            >
                                                <Icon name="trash" />
                                                {deleting === f.id ? '...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <NewFloorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleNewFloorConfirm}
            />
        </div>
    );
}
