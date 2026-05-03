import {useEffect, useState} from "react";
import {api} from "../../services/api.ts";
import type {Floor} from "../../types";
import {NewFloorModal} from "../../components/NewFloorModal.tsx";

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

    const handleNewFloorConfirm = (name: string, image: string, markers: {x: number, y: number}[]) => {
        // Create the actual floor
        api.createFloor(name, image).then(f => {
            // Add all the desks
            let i = 1
            markers.forEach(({x, y}) => {
                const label = `Desk ${i}`
                api.createDesk(f.id, label, x, y);
                i++;
            })
            // Update our list of floors
            setFloors((prev) => [...prev, f]);
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >New Floor</button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-6 text-gray-500 text-sm">Loading...</div>
                ) : floors.length === 0 ? (
                    <div className="p-6 text-gray-500 text-sm">No floors found.</div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[300px] text-sm">
                        <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {floors.map((f) => (
                            <tr key={f.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-400">#{f.id}</td>
                                <td className="px-4 py-3">{f.name}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDelete(f.id)}
                                        disabled={deleting === f.id}
                                        className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                    >
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