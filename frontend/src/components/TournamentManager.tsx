import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Calendar, Play, Trash2, Crown, MapPin } from 'lucide-react';
import TournamentCreator from './TournamentCreator';
import { apiService } from '@/services/api';
import { Tournament } from '@/types';
import { getFormatDisplayText, getStageDisplayText } from '@/utils/helpers';

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
  
  // State for completing tournaments
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

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

  const handleCompleteTournament = async (tournamentId: number) => {
    setCompleting(tournamentId);
    try {
      await apiService.completeTournament(tournamentId);
      await loadTournaments();
      await onTournamentChanged();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to complete tournament';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setCompleting(null);
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
                      className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200"
                    >
                      {getFormatDisplayText(tournament)}
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
                      <MapPin className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">Venue</div>
                        <div className="text-sm">
                          {tournament.venue || 'TBD'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Trophy className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium">Stage</div>
                        <div className="text-sm">
                          {getStageDisplayText(tournament)}
                        </div>
                      </div>
                    </div>
                  </div>
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
