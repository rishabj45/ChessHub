import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Calendar, Users, Play, Edit, Trash2, Crown, ArrowRight, CheckCircle } from 'lucide-react';
import TournamentCreator from './TournamentCreator';
import { apiService } from '@/services/api';
import { Tournament } from '@/types';

interface TournamentManagerProps {
  isAdmin: boolean;
  currentTournament: Tournament | null;
  onTournamentChanged: () => void;
}

const TournamentManager: React.FC<TournamentManagerProps> = ({ 
  isAdmin, 
  currentTournament, 
  onTournamentChanged 
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingCurrent, setSettingCurrent] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Stage progression states
  const [stageProgression, setStageProgression] = useState<Record<number, any>>({});
  const [advancing, setAdvancing] = useState<number | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    // Load stage progression for group_knockout tournaments
    tournaments.forEach(tournament => {
      if (tournament.format === 'group_knockout' && tournament.stage !== 'completed') {
        loadStageProgression(tournament.id);
      }
    });
  }, [tournaments, isAdmin]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const allTournaments = await apiService.getTournaments();
      setTournaments(allTournaments);
      setError(null);
    } catch (err: any) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrent = async (tournament: Tournament) => {
    if (!isAdmin) {
      setError('Admin access required to set current tournament');
      return;
    }

    try {
      setSettingCurrent(tournament.id);
      await apiService.setCurrentTournament(tournament.id);
      await loadTournaments(); // Refresh the tournament list
      await onTournamentChanged(); // Refresh the current tournament in the app
      setError(null);
    } catch (err: any) {
      console.error('Error setting current tournament:', err);
      setError(err.response?.data?.detail || 'Failed to set current tournament');
    } finally {
      setSettingCurrent(null);
    }
  };

  const handleDeleteConfirm = (tournamentId: number) => {
    setShowDeleteConfirm(tournamentId);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  const handleDeleteTournament = async (tournamentId: number) => {
    if (!isAdmin) {
      setError('Admin access required to delete tournaments');
      return;
    }

    try {
      setDeleting(tournamentId);
      setShowDeleteConfirm(null);
      await apiService.deleteTournament(tournamentId);
      await loadTournaments(); // Refresh the tournament list
      await onTournamentChanged(); // Refresh the current tournament in the app
      setError(null);
    } catch (err: any) {
      console.error('Error deleting tournament:', err);
      setError(err.response?.data?.detail || 'Failed to delete tournament');
    } finally {
      setDeleting(null);
    }
  };

  const handleTournamentCreated = async () => {
    setShowCreator(false);
    await loadTournaments();
    await onTournamentChanged();
  };

  // Stage progression functions
  const loadStageProgression = async (tournamentId: number) => {
    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament || tournament.format !== 'group_knockout') return;

      let progression: any = {};

      if (tournament.stage === 'final') {
        const canComplete = await apiService.canCompleteTournament(tournamentId);
        progression.canComplete = canComplete.can_complete;
      }

      setStageProgression(prev => ({ ...prev, [tournamentId]: progression }));
    } catch (error) {
      console.error('Failed to load stage progression:', error);
    }
  };

  const handleCompleteTournament = async (tournamentId: number) => {
    setAdvancing(tournamentId);
    try {
      await apiService.completeTournament(tournamentId);
      alert('✅ Tournament completed successfully!');
      await loadTournaments();
      await onTournamentChanged();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to complete tournament';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setAdvancing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'not_yet_started':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'group':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'semi_final':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'final':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (showCreator) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Trophy className="mr-2 text-yellow-500" />
            Create New Tournament
          </h2>
          <button
            onClick={() => setShowCreator(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Tournaments
          </button>
        </div>
        <TournamentCreator
          isAdmin={isAdmin}
          onTournamentCreated={handleTournamentCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Trophy className="mr-2 text-yellow-500" />
          Tournaments
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreator(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tournaments Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first tournament.</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Tournament
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                currentTournament?.id === tournament.id
                  ? 'border-l-yellow-500 bg-yellow-50'
                  : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {tournament.name}
                    </h3>
                    {currentTournament?.id === tournament.id && (
                      <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        <Crown className="w-3 h-3 mr-1" />
                        Current
                      </div>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(
                        tournament.stage
                      )}`}
                    >
                      {tournament.stage === 'not_yet_started' 
                        ? 'Yet to start' 
                        : tournament.stage === 'completed'
                          ? 'Completed'
                          : tournament.stage.replace(/_/g, ' ')
                      }
                    </span>
                  </div>

                  {tournament.description && (
                    <p className="text-gray-600 mb-3">{tournament.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">Start</div>
                        <div>{formatDate(tournament.start_date)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">End</div>
                        <div>{formatDate(tournament.end_date)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">Progress</div>
                        <div>
                          {tournament.stage === 'completed' 
                            ? `All ${tournament.total_rounds} rounds completed`
                            : `Round ${tournament.current_round} of ${tournament.total_rounds}`
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Trophy className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">Stage</div>
                        <div className="capitalize">
                          {tournament.stage === 'not_yet_started' 
                            ? 'Yet to start' 
                            : tournament.stage === 'completed'
                              ? 'Completed'
                              : tournament.stage || 'group'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stage Progression Controls for Group+Knockout tournaments */}
                  {tournament.format === 'group_knockout' && isAdmin && tournament.stage !== 'completed' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tournament Progression</h4>
                      <div className="flex items-center space-x-4">
                        {/* Group Stage */}
                        <div className={`flex items-center space-x-2 ${tournament.stage === 'group' ? 'text-blue-600' : tournament.stage === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full ${tournament.stage === 'group' ? 'bg-blue-600' : (tournament.stage !== 'group' && tournament.stage !== 'completed') ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium">Group Stage</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        {/* Semifinal Stage */}
                        <div className={`flex items-center space-x-2 ${tournament.stage === 'semifinal' ? 'text-blue-600' : (tournament.stage === 'final' || tournament.stage === 'completed') ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full ${tournament.stage === 'semifinal' ? 'bg-blue-600' : (tournament.stage === 'final' || tournament.stage === 'completed') ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium">Semifinal</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        {/* Final Stage */}
                        <div className={`flex items-center space-x-2 ${tournament.stage === 'final' ? 'text-blue-600' : tournament.stage === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full ${tournament.stage === 'final' ? 'bg-blue-600' : tournament.stage === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium">Final</span>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        {/* Completed */}
                        <div className={`flex items-center space-x-2 ${tournament.stage === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircle className={`w-4 h-4 ${tournament.stage === 'completed' ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      </div>

                      {/* Stage Action Buttons */}
                      <div className="mt-3 flex space-x-2">
                        {tournament.stage === 'final' && stageProgression[tournament.id]?.canComplete && (
                          <button
                            onClick={() => handleCompleteTournament(tournament.id)}
                            disabled={advancing === tournament.id}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {advancing === tournament.id ? 'Completing...' : 'Complete Tournament'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="ml-4 flex flex-col space-y-2">
                    {currentTournament?.id !== tournament.id && (
                      <button
                        onClick={() => handleSetCurrent(tournament)}
                        disabled={settingCurrent === tournament.id || deleting === tournament.id}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {settingCurrent === tournament.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Setting...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Set as Current</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteConfirm(tournament.id)}
                      disabled={settingCurrent === tournament.id || deleting === tournament.id}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting === tournament.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Delete Tournament
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this tournament? This action cannot be undone and will remove all associated data including teams, players, matches, and games.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTournament(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentManager;
