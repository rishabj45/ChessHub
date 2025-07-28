import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import TeamEditor from './TeamEditor';
import { apiService } from '@/services/api';
import { Team, Tournament, Player } from '@/types';

interface TeamsProps {
  isAdmin: boolean;
  tournament: Tournament | null;
}

const Teams: React.FC<TeamsProps> = ({ isAdmin, tournament }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!tournament) return;

    // Step 1: Load teams
    apiService.getTeams().then(allTeams => {
      const filtered = allTeams.filter(team => team.tournament_id === tournament.id);
      setTeams(filtered);
    });

    // Step 2: Load all players
    apiService.getPlayers().then(setPlayers);
  }, [tournament]);

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setShowEditor(true);
  };

  const handleSave = async (team: Team) => {
    await apiService.updateTeam(team.id, team);
    setTeams(ts => ts.map(t => (t.id === team.id ? team : t)));
    
    // Reload players to reflect any changes made in TeamEditor
    const updatedPlayers = await apiService.getPlayers();
    setPlayers(updatedPlayers);
    
    setShowEditor(false);
  };

  const handleClose = async () => {
    // Reload players to reflect any changes made in TeamEditor
    // (since player operations are saved immediately)
    const updatedPlayers = await apiService.getPlayers();
    setPlayers(updatedPlayers);
    
    setShowEditor(false);
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">Teams</h2>

      {teams.length === 0 ? (
        <p>No teams found for this tournament.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {teams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id);

            return (
              <li key={team.id} className="bg-white p-4 rounded shadow space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users />
                    <span className="font-semibold">{team.name}</span>
                  </div>

                  {isAdmin && (!tournament || tournament.stage === 'not_yet_started') && (
                    <button
                      className="px-2 py-1 border rounded text-blue-500"
                      onClick={() => handleEdit(team)}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="ml-6 text-sm text-gray-700">
                  {teamPlayers.length > 0 ? (
                    <ul className="list-disc space-y-1">
                      {teamPlayers.map(player => (
                        <li key={player.id}>
                          <span>{player.name}</span>
                          <span className="text-gray-500 ml-2 text-xs">
                            (Rating: {player.rating})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No players assigned</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showEditor && selectedTeam && (
        <TeamEditor
          team={selectedTeam}
          isOpen={showEditor}
          onClose={handleClose}
          onSave={handleSave}
          isAdmin={isAdmin}
          tournamentStage={tournament?.stage}
        />
      )}
    </div>
  );
};

export default Teams;
