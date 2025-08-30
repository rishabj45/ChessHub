import React, { useState, useEffect } from 'react';
import { Users, Edit, Crown, Star, Trophy, Play } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Teams</h2>
              {tournament && (
                <p className="text-gray-600 text-sm">
                  {teams.length} team{teams.length !== 1 ? 's' : ''} • {players.length} player{players.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          {/* Start Tournament Button */}
          {isAdmin && tournament && tournament.stage === 'not_yet_started' && (
            <button
              onClick={handleStartTournament}
              disabled={starting}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Play className="h-5 w-5" />
              <span>{starting ? 'Starting...' : 'Start Tournament'}</span>
            </button>
          )}
        </div>

        {/* Content Section */}
        {!tournament ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tournament Selected</h3>
              <p className="text-gray-500 max-w-sm">Please create or select a tournament to view and manage teams.</p>
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Teams Yet</h3>
              <p className="text-gray-500 max-w-sm">Teams will appear here once they are added to the tournament.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => {
              const teamPlayers = players.filter(p => p.team_id === team.id);
              const averageRating = teamPlayers.length > 0 
                ? Math.round(teamPlayers.reduce((sum, p) => sum + p.rating, 0) / teamPlayers.length)
                : 0;

              return (
                <div key={team.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                  {/* Team Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{team.name}</h3>
                          <p className="text-blue-100 text-sm">
                            {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (!tournament || tournament.stage === 'not_yet_started') && (
                        <button
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                          onClick={() => handleEdit(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team Content */}
                  <div className="p-4">
                    {teamPlayers.length > 0 ? (
                      <>
                        {/* Players List */}
                        <div className="space-y-2">
                          {teamPlayers.map((player, index) => (
                            <div key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                                </div>
                                <span className="font-medium text-gray-800">{player.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-semibold text-gray-600">{player.rating}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No players assigned</p>
                      </div>
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
