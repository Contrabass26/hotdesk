import {useEffect, useState} from "react";
import {api} from "../../services/api.ts";
import type {Floor} from "../../types";

export function FloorsPage() {
    const [loading, setLoading] = useState(true);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [deleting, setDeleting] = useState<number | null>(null);

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
            console.error('Failed to delete booking:', error);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-6 text-gray-500 text-sm">Loading...</div>
                ) : floors.length === 0 ? (
                    <div className="p-6 text-gray-500 text-sm">No bookings found.</div>
                ) : (
                    <table className="w-full text-sm">
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
                )}
            </div>
        </div>
    );
}