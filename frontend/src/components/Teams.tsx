import React, { useState, useEffect } from 'react';
import { Users, Edit, Play } from 'lucide-react';
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
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!tournament) return;
    apiService.getTeams(tournament.id).then(setTeams);
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
    
    if (tournament) {
      const updatedPlayers = await apiService.getPlayers(undefined, tournament.id);
      setPlayers(updatedPlayers);
    }
    
    setShowEditor(false);
  };

  const handleClose = async () => {
    if (tournament) {
      const updatedPlayers = await apiService.getPlayers(undefined, tournament.id);
      setPlayers(updatedPlayers);
    }
    
    setShowEditor(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
          </div>
          
          {/* Start Tournament Button */}
          {isAdmin && tournament && tournament.stage === 'not_yet_started' && (
            <button
              onClick={handleStartTournament}
              disabled={starting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
            >
              <Play className="h-4 w-4" />
              <span>{starting ? 'Starting...' : 'Start Tournament'}</span>
            </button>
          )}
        </div>

        {/* Content */}
        {!tournament ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tournament</h3>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams</h3>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => {
              const teamPlayers = players.filter(p => p.team_id === team.id);

              return (
                <div key={team.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  {/* Team Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    </div>
                    {isAdmin && (!tournament || tournament.stage === 'not_yet_started') && (
                      <button
                        onClick={() => handleEdit(team)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Players List */}
                  <div className="space-y-2">
                    {teamPlayers.length > 0 ? (
                      teamPlayers.map((player, index) => (
                        <div key={player.id} className="flex justify-between items-center py-1">
                          <span className="text-gray-700">{player.name}</span>
                          <span className="text-sm text-gray-500">{player.rating}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No players assigned</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Team Editor Modal */}
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
    </div>
  );
};

export default Teams;
