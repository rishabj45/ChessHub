import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import TeamEditor from './TeamEditor';
import { apiService } from '@/services/api';
import { Team, Tournament, Player, TabType } from '@/types';

interface TeamsProps {
  isAdmin: boolean;
  tournament: Tournament | null;
  onUpdate?: () => void;
  onTabChange?: (tab: TabType) => void;
}

const Teams: React.FC<TeamsProps> = ({ isAdmin, tournament, onUpdate, onTabChange }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!tournament) return;

    // Step 1: Load teams for this tournament
    apiService.getTeams(tournament.id).then(setTeams);

    // Step 2: Load all players for this tournament
    apiService.getPlayers(undefined, tournament.id).then(setPlayers);
  }, [tournament]);

    const handleStartTournament = async () => {
    if (!tournament) return;
    
    setStarting(true);
    try {
      await apiService.startTournament(tournament.id);
      onUpdate?.();
      onTabChange?.('schedule');
    } catch (error) {
      console.error('Failed to start tournament:', error);
    } finally {
      setStarting(false);
    }
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setShowEditor(true);
  };

  const handleSave = async (team: Team) => {
    await apiService.updateTeam(team.id, { name: team.name });
    setTeams(ts => ts.map(t => (t.id === team.id ? team : t)));
    
    // Reload players to reflect any changes made in TeamEditor
    if (tournament) {
      const updatedPlayers = await apiService.getPlayers(undefined, tournament.id);
      setPlayers(updatedPlayers);
    }
    
    setShowEditor(false);
  };

  const handleClose = async () => {
    // Reload players to reflect any changes made in TeamEditor
    // (since player operations are saved immediately)
    if (tournament) {
      const updatedPlayers = await apiService.getPlayers(undefined, tournament.id);
      setPlayers(updatedPlayers);
    }
    
    setShowEditor(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl">Teams</h2>
        
        {/* Start Tournament Button */}
        {isAdmin && tournament && tournament.stage === 'not_yet_started' && (
          <button
            onClick={handleStartTournament}
            disabled={isAdvancing}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold shadow-lg transition-colors duration-200"
          >
            {isAdvancing ? 'Starting...' : 'Start Tournament'}
          </button>
        )}
      </div>

      {!tournament ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tournament Available</h2>
            <p className="text-gray-500">Please create or select a tournament to view teams.</p>
          </div>
        </div>
      ) : teams.length === 0 ? (
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
