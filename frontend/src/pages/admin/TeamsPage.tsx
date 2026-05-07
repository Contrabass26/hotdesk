import {useEffect, useState} from 'react';
import type {User, Team} from '../../types';
import {api} from '../../services/api';
import {NewTeamModal} from "../../components/NewTeamModal.tsx";

export function TeamsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTeamsList, setShowTeamsList] = useState(false);
    const [modifyingUser, setModifyingUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        api.getUsers()
            .then(users => {
                setUsers(users);
                api.getTeams()
                    .then(setTeams)
                    .catch(console.error)
                    .finally(() => setLoading(false));
            })
            .catch(console.error)
    }, []);

    if (loading) return <div className="text-gray-500">Loading...</div>;

    const handleRemoveFromTeam = async (user: User) => {
        try {
            const updated = await api.updateUser(user.id, user.isAdmin, null);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleDeleteTeam = async (team: Team) => {
        try {
            await api.deleteTeam(team.id);
            setTeams((prev) => prev.filter(t => t.id !== team.id));
        } catch (error) {
            console.error('Failed to delete team:', error);
        }
    };

    const handleSelectTeam = async (user: User, team: Team) => {
        try {
            const updated = await api.updateUser(user.id, user.isAdmin, team.id);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        } catch (error) {
            console.error('Failed to add user to team:', error);
        }
    }

    const handleCreateTeam = async (name: string, departmentId: number) => {
        const newTeam = await api.createTeam(name, departmentId);
        setTeams((prev) => [...prev, newTeam]);
    }

    return (
        <div>
            <div>
                <div className="flex justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Unassigned</h2>
                    <button
                        className="px-4 py-2 mb-2 mt-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Create Team
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y">
                            {users.filter(user => user.teamId == null).map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 cursor-pointer"
                                            onClick={() => {
                                                setModifyingUser(user);
                                                setShowTeamsList(!showTeamsList);
                                            }}
                                        >
                                            Add to Team
                                        </button>
                                    </td>
                                    {showTeamsList && user == modifyingUser && (
                                        <div className="absolute mt-2 w-48 bg-white border rounded-md shadow-lg z-30">
                                            {teams.map((team) => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => {
                                                        if (modifyingUser) handleSelectTeam(modifyingUser, team);
                                                        setModifyingUser(null);
                                                        setShowTeamsList(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                                                >
                                                    <div className="font-medium">{team.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {teams.map(team => (
                <div>
                    <div className="flex justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-6">{team.name}</h2>
                        <button
                            className="px-4 py-2 mb-2 mt-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                            onClick={() => handleDeleteTeam(team)}
                        >
                            Delete Team
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm">
                                <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y">
                                {users.filter(user => user.teamId == team.id).map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{user.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 cursor-pointer"
                                                onClick={() => handleRemoveFromTeam(user)}
                                            >
                                                Remove from Team
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}

            <NewTeamModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleCreateTeam}
            />
        </div>
    )
}
