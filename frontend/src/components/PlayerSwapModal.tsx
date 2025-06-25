// frontend/src/components/PlayerSwapModal.tsx  
import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';
import { Player, GameResponse, MatchResponse, Team } from '@/types';

interface PlayerSwapModalProps {
  match: MatchResponse;
  game: GameResponse;
  isOpen: boolean;
  onClose: () => void;
  onSwapComplete: () => void;
  players: Player[];
  teams: Team[];
}

interface AvailableSwapsResponse {
  white_team_players: Player[];
  black_team_players: Player[];
  current_assignments: Record<number, number>; // board_number -> player_id
}

const PlayerSwapModal: React.FC<PlayerSwapModalProps> = ({
  match,
  game,
  isOpen,
  onClose,
  onSwapComplete,
  players,
  teams
}) => {
  const [availableSwaps, setAvailableSwaps] = useState<AvailableSwapsResponse | null>(null);
  const [selectedWhitePlayer, setSelectedWhitePlayer] = useState<number>(game.white_player_id);
  const [selectedBlackPlayer, setSelectedBlackPlayer] = useState<number>(game.black_player_id);
  const [swapReason, setSwapReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableSwaps();
      setSelectedWhitePlayer(game.white_player_id);
      setSelectedBlackPlayer(game.black_player_id);
      setSwapReason('');
      setError(null);
    }
  }, [isOpen, game.id]);

  const loadAvailableSwaps = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAvailableSwaps(match.id);
      setAvailableSwaps(response);
    } catch (err) {
      console.error('Failed to load available swaps:', err);
      setError('Failed to load available players for swapping');
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!availableSwaps) return;

    // Check if any changes were made
    const whiteChanged = selectedWhitePlayer !== game.white_player_id;  
    const blackChanged = selectedBlackPlayer !== game.black_player_id;

    if (!whiteChanged && !blackChanged) {
      setError('No changes made to player assignments');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.swapGamePlayers(match.id, game.id, {
        new_white_player_id: whiteChanged ? selectedWhitePlayer : undefined,
        new_black_player_id: blackChanged ? selectedBlackPlayer : undefined,
        reason: swapReason.trim() || undefined
      });

      onSwapComplete();
      onClose();
    } catch (err: any) {
      console.error('Failed to swap players:', err);
      setError(err.response?.data?.detail || 'Failed to swap players');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: number) => {
    return players.find(p => p.id === playerId)?.name || `Player ${playerId}`;
  };

  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
  };

  const getPlayerConflicts = (playerId: number, isWhite: boolean) => {
    if (!availableSwaps) return null;
    
    // Check if player is already assigned to another board in this match
    const otherBoards = match.games.filter(g => g.id !== game.id);
    const conflict = otherBoards.find(g => 
      g.white_player_id === playerId || g.black_player_id === playerId
    );
    
    if (conflict) {
      return `Already playing Board ${conflict.board_number}`;
    }
    
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Swap Players - Board {game.board_number}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-black"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-sm text-gray-700">
            <strong>Match:</strong> {getTeamName(match.white_team_id)} vs {getTeamName(match.black_team_id)}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Board:</strong> {game.board_number}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p>Loading available players...</p>
          </div>
        ) : availableSwaps ? (
          <div className="space-y-6">
            {/* White Player Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                White Player ({getTeamName(match.white_team_id)}):
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={selectedWhitePlayer}
                onChange={(e) => setSelectedWhitePlayer(Number(e.target.value))}
                disabled={loading}
              >
                {availableSwaps.white_team_players.map(player => {
                  const conflict = getPlayerConflicts(player.id!, true);
                  return (
                    <option 
                      key={player.id} 
                      value={player.id}
                      disabled={!!conflict}
                    >
                      {player.name} {player.rating ? `(${player.rating})` : ''}
                      {conflict ? ` - ${conflict}` : ''}
                    </option>
                  );
                })}
              </select>
              {selectedWhitePlayer !== game.white_player_id && (
                <p className="text-xs text-blue-600 mt-1">
                  Will change from: {getPlayerName(game.white_player_id)}
                </p>
              )}
            </div>

            {/* Black Player Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Black Player ({getTeamName(match.black_team_id)}):
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={selectedBlackPlayer}
                onChange={(e) => setSelectedBlackPlayer(Number(e.target.value))}
                disabled={loading}
              >
                {availableSwaps.black_team_players.map(player => {
                  const conflict = getPlayerConflicts(player.id!, false);
                  return (
                    <option 
                      key={player.id} 
                      value={player.id}
                      disabled={!!conflict}
                    >
                      {player.name} {player.rating ? `(${player.rating})` : ''}
                      {conflict ? ` - ${conflict}` : ''}
                    </option>
                  );
                })}
              </select>
              {selectedBlackPlayer !== game.black_player_id && (
                <p className="text-xs text-blue-600 mt-1">
                  Will change from: {getPlayerName(game.black_player_id)}
                </p>
              )}
            </div>

            {/* Reason for Swap */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for swap (optional):
              </label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                rows={3}
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                placeholder="e.g., Player unavailable, strategic decision..."
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                onClick={executeSwap}
                disabled={loading || (!selectedWhitePlayer && !selectedBlackPlayer)}
              >
                <RefreshCw className="mr-1" size={16} />
                {loading ? 'Swapping...' : 'Swap Players'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load available players
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSwapModal;