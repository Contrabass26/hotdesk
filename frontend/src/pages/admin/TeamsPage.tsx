import { useEffect, useState } from 'react';
import type { User, Team } from '../../types';
import { api } from '../../services/api';
import { NewTeamModal } from "../../components/NewTeamModal.tsx";
import { Icon } from '../../components/ui/Icons';

export function TeamsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modifyingUserId, setModifyingUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getUsers(), api.getTeams()])
      .then(([nextUsers, nextTeams]) => {
        setUsers(nextUsers);
        setTeams(nextTeams);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="kn-loading"><div className="kn-panel px-6 py-4">Loading teams...</div></div>;

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

  const handleSelectTeam = async (user: User, teamId: number) => {
    try {
      const updated = await api.updateUser(user.id, user.isAdmin, teamId);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setModifyingUserId(null);
    } catch (error) {
      console.error('Failed to add user to team:', error);
    }
  };

  const handleCreateTeam = async (name: string, departmentId: number) => {
    const newTeam = await api.createTeam(name, departmentId);
    setTeams((prev) => [...prev, newTeam]);
  };

  const unassignedUsers = users.filter(user => user.teamId == null);

  const renderUserRows = (teamUsers: User[], mode: 'assign' | 'remove') => (
    <div className="overflow-x-auto">
      <table className="kn-table min-w-[620px]">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {teamUsers.map((user) => (
            <tr key={user.id}>
              <td className="font-black">
                <div className="flex items-center gap-3">
                  <span className="kn-icon-tile text-xs font-black">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  {user.name}
                </div>
              </td>
              <td className="text-[var(--kn-muted)]">{user.email}</td>
              <td className="text-right">
                {mode === 'assign' ? (
                  modifyingUserId === user.id ? (
                    <select
                      className="kn-select ml-auto max-w-[220px]"
                      defaultValue=""
                      onChange={(event) => {
                        const teamId = Number(event.target.value);
                        if (teamId) void handleSelectTeam(user, teamId);
                      }}
                    >
                      <option value="">Choose team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  ) : (
                    <button className="kn-button kn-button-success" onClick={() => setModifyingUserId(user.id)}>
                      <Icon name="plus" />
                      Add to Team
                    </button>
                  )
                ) : (
                  <button className="kn-button kn-button-danger" onClick={() => handleRemoveFromTeam(user)}>
                    <Icon name="close" />
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="kn-section-title">Teams</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">
            Assign people into departments so desk recommendations can reflect real working groups.
          </p>
        </div>
        <button
          className="kn-button kn-button-primary self-start sm:self-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <Icon name="plus" />
          Create Team
        </button>
      </div>

      <section className="kn-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--kn-line)] px-5 py-4">
          <h3 className="kn-section-title">Unassigned</h3>
          <span className="kn-badge kn-badge-neutral">{unassignedUsers.length} people</span>
        </div>
        {unassignedUsers.length === 0 ? (
          <div className="kn-empty m-5">Everyone is assigned to a team.</div>
        ) : (
          renderUserRows(unassignedUsers, 'assign')
        )}
      </section>

      {teams.map(team => {
        const teamUsers = users.filter(user => user.teamId === team.id);

        return (
          <section className="kn-panel overflow-hidden" key={team.id}>
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--kn-line)] px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="kn-icon-tile">
                  <Icon name="building" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="kn-section-title">{team.name}</h3>
                  <p className="text-sm font-semibold text-[var(--kn-muted)]">{teamUsers.length} assigned</p>
                </div>
              </div>
              <button
                className="kn-button kn-button-danger self-start sm:self-auto"
                onClick={() => handleDeleteTeam(team)}
              >
                <Icon name="trash" />
                Delete Team
              </button>
            </div>
            {teamUsers.length === 0 ? (
              <div className="kn-empty m-5">No team members yet.</div>
            ) : (
              renderUserRows(teamUsers, 'remove')
            )}
          </section>
        );
      })}

      <NewTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreateTeam}
      />
    </div>
  );
}
