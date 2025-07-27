// frontend/src/components/MatchSwapModal.tsx
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Users, ArrowUpDown } from 'lucide-react';
import { apiService } from '../services/api';
import { Player, MatchResponse, Team } from '../types';

interface MatchSwapModalProps {
  match: MatchResponse;
  isOpen: boolean;
  onClose: () => void;
  onSwapComplete: () => void;
  players: Player[];
  teams: Team[];
}

interface TeamPlayers {
  playing: Player[];
  substitutes: Player[];
}

interface SwapData {
  white_team_swaps: { player1_id: number; player2_id: number }[];
  black_team_swaps: { player1_id: number; player2_id: number }[];
}

const MatchSwapModal: React.FC<MatchSwapModalProps> = ({
  match,
  isOpen,
  onClose,
  onSwapComplete,
  players,
  teams
}) => {
  const [whiteTeamPlayers, setWhiteTeamPlayers] = useState<TeamPlayers>({ playing: [], substitutes: [] });
  const [blackTeamPlayers, setBlackTeamPlayers] = useState<TeamPlayers>({ playing: [], substitutes: [] });
  const [selectedWhitePlayers, setSelectedWhitePlayers] = useState<number[]>([]);
  const [selectedBlackPlayers, setSelectedBlackPlayers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTeamPlayers();
      setSelectedWhitePlayers([]);
      setSelectedBlackPlayers([]);
      setError(null);
    }
  }, [isOpen, match.id]);

  const loadTeamPlayers = () => {
    // Get all players for both teams
    const whiteTeamAllPlayers = players.filter(p => p.team_id === match.white_team_id);
    const blackTeamAllPlayers = players.filter(p => p.team_id === match.black_team_id);

    // Separate playing vs substitute players based on current match games
    const playingWhiteIds = match.games.map(g => g.white_player_id);
    const playingBlackIds = match.games.map(g => g.black_player_id);

    const whitePlayingPlayers = whiteTeamAllPlayers
      .filter(p => playingWhiteIds.includes(p.id!))
      .sort((a, b) => {
        // Sort by board number (game position)
        const boardA = match.games.find(g => g.white_player_id === a.id)?.board_number || 0;
        const boardB = match.games.find(g => g.white_player_id === b.id)?.board_number || 0;
        return boardA - boardB;
      });

    const blackPlayingPlayers = blackTeamAllPlayers
      .filter(p => playingBlackIds.includes(p.id!))
      .sort((a, b) => {
        const boardA = match.games.find(g => g.black_player_id === a.id)?.board_number || 0;
        const boardB = match.games.find(g => g.black_player_id === b.id)?.board_number || 0;
        return boardA - boardB;
      });

    const whiteSubstitutes = whiteTeamAllPlayers
      .filter(p => !playingWhiteIds.includes(p.id!))
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const blackSubstitutes = blackTeamAllPlayers
      .filter(p => !playingBlackIds.includes(p.id!))
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    setWhiteTeamPlayers({ playing: whitePlayingPlayers, substitutes: whiteSubstitutes });
    setBlackTeamPlayers({ playing: blackPlayingPlayers, substitutes: blackSubstitutes });
  };

  const handlePlayerClick = (playerId: number, isWhiteTeam: boolean) => {
    if (isWhiteTeam) {
      // Clear black team selection when selecting white team player
      setSelectedBlackPlayers([]);
      
      setSelectedWhitePlayers(prev => {
        if (prev.includes(playerId)) {
          // Unselect if already selected
          return prev.filter(id => id !== playerId);
        } else if (prev.length >= 2) {
          // Replace oldest selection if already have 2 selected
          return [prev[1], playerId];
        } else {
          // Add to selection
          return [...prev, playerId];
        }
      });
    } else {
      // Clear white team selection when selecting black team player
      setSelectedWhitePlayers([]);
      
      setSelectedBlackPlayers(prev => {
        if (prev.includes(playerId)) {
          return prev.filter(id => id !== playerId);
        } else if (prev.length >= 2) {
          return [prev[1], playerId];
        } else {
          return [...prev, playerId];
        }
      });
    }
  };

  const canSwap = () => {
    const whiteSelected = selectedWhitePlayers.length === 2;
    const blackSelected = selectedBlackPlayers.length === 2;
    
    if (!whiteSelected && !blackSelected) return false;

    // Check if swap makes sense (not both substitutes)
    if (whiteSelected) {
      const bothSubs = selectedWhitePlayers.every(id => 
        whiteTeamPlayers.substitutes.some(p => p.id === id)
      );
      if (bothSubs) return false;
    }

    if (blackSelected) {
      const bothSubs = selectedBlackPlayers.every(id => 
        blackTeamPlayers.substitutes.some(p => p.id === id)
      );
      if (bothSubs) return false;
    }

    return true;
  };

  const executeSwap = async () => {
    if (!canSwap()) {
      setError('Invalid swap selection');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const swapData: SwapData = {
        white_team_swaps: selectedWhitePlayers.length === 2 ? 
          [{ player1_id: selectedWhitePlayers[0], player2_id: selectedWhitePlayers[1] }] : [],
        black_team_swaps: selectedBlackPlayers.length === 2 ? 
          [{ player1_id: selectedBlackPlayers[0], player2_id: selectedBlackPlayers[1] }] : []
      };

      await apiService.swapMatchPlayers(match.id, swapData);
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

  const getBoardNumber = (playerId: number, isWhite: boolean) => {
    const game = match.games.find(g => 
      isWhite ? g.white_player_id === playerId : g.black_player_id === playerId
    );
    return game?.board_number;
  };

  const renderPlayerList = (teamPlayers: TeamPlayers, selectedPlayers: number[], isWhiteTeam: boolean) => {
    const teamName = isWhiteTeam ? getTeamName(match.white_team_id) : getTeamName(match.black_team_id);
    
    return (
      <div className="flex-1">
        <h4 className="font-medium mb-3 text-center">{teamName}</h4>
        
        {/* Playing Players */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-600 mb-2 flex items-center">
            <Users size={14} className="mr-1" />
            Playing (Boards 1-4)
          </div>
          <div className="space-y-2">
            {teamPlayers.playing.map((player) => {
              const isSelected = selectedPlayers.includes(player.id!);
              const boardNum = getBoardNumber(player.id!, isWhiteTeam);
              
              return (
                <button
                  key={player.id}
                  className={`w-full p-2 rounded border text-left transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 border-blue-400 text-blue-800' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePlayerClick(player.id!, isWhiteTeam)}
                  disabled={loading}
                >
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-gray-500">
                    Board {boardNum} • Rating: {player.rating || 'Unrated'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Substitute Players */}
        {teamPlayers.substitutes.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Substitutes</div>
            <div className="space-y-2">
              {teamPlayers.substitutes.map((player) => {
                const isSelected = selectedPlayers.includes(player.id!);
                
                return (
                  <button
                    key={player.id}
                    className={`w-full p-2 rounded border text-left transition-colors ${
                      isSelected 
                        ? 'bg-green-100 border-green-400 text-green-800' 
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => handlePlayerClick(player.id!, isWhiteTeam)}
                    disabled={loading}
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-gray-500">
                      Substitute • Rating: {player.rating || 'Unrated'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl p-6 rounded-lg shadow-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Swap Players - Match</h3>
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
          <p className="text-xs text-gray-600 mt-1">
            Select 2 players from the same team to swap their positions. Playing players can swap boards, or substitute with bench players.
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
            <p>Processing swap...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Player Lists */}
            <div className="flex gap-6">
              {renderPlayerList(whiteTeamPlayers, selectedWhitePlayers, true)}
              
              <div className="flex items-center justify-center px-4">
                <div className="text-gray-400">
                  <ArrowUpDown size={24} />
                </div>
              </div>
              
              {renderPlayerList(blackTeamPlayers, selectedBlackPlayers, false)}
            </div>

            {/* Selected Players Summary */}
            {(selectedWhitePlayers.length > 0 || selectedBlackPlayers.length > 0) && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-1">Selected for swap:</div>
                {selectedWhitePlayers.length > 0 && (
                  <div className="text-sm text-blue-700">
                    {getTeamName(match.white_team_id)}: {selectedWhitePlayers.map(id => getPlayerName(id)).join(' ↔ ')}
                  </div>
                )}
                {selectedBlackPlayers.length > 0 && (
                  <div className="text-sm text-blue-700">
                    {getTeamName(match.black_team_id)}: {selectedBlackPlayers.map(id => getPlayerName(id)).join(' ↔ ')}
                  </div>
                )}
              </div>
            )}

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
                disabled={loading || !canSwap()}
              >
                <ArrowUpDown className="mr-1" size={16} />
                {loading ? 'Swapping...' : 'Swap Players'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSwapModal;
