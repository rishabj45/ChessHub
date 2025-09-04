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
    const whiteTeamAllPlayers = players.filter(p => p.team_id === match.white_team_id);
    const blackTeamAllPlayers = players.filter(p => p.team_id === match.black_team_id);

    const playingWhiteIds = match.games.map(g => g.white_player_id);
    const playingBlackIds = match.games.map(g => g.black_player_id);

    const whitePlayingPlayers = whiteTeamAllPlayers
      .filter(p => playingWhiteIds.includes(p.id))
      .sort((a, b) => {
        const boardA = match.games.find(g => g.white_player_id === a.id)?.board_number || 999;
        const boardB = match.games.find(g => g.white_player_id === b.id)?.board_number || 999;
        return boardA - boardB;
      });

    const blackPlayingPlayers = blackTeamAllPlayers
      .filter(p => playingBlackIds.includes(p.id))
      .sort((a, b) => {
        const boardA = match.games.find(g => g.black_player_id === a.id)?.board_number || 999;
        const boardB = match.games.find(g => g.black_player_id === b.id)?.board_number || 999;
        return boardA - boardB;
      });

    const whiteSubstitutes = whiteTeamAllPlayers
      .filter(p => !playingWhiteIds.includes(p.id))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const blackSubstitutes = blackTeamAllPlayers
      .filter(p => !playingBlackIds.includes(p.id))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setWhiteTeamPlayers({ playing: whitePlayingPlayers, substitutes: whiteSubstitutes });
    setBlackTeamPlayers({ playing: blackPlayingPlayers, substitutes: blackSubstitutes });
  };

  const handlePlayerClick = (playerId: number, isWhiteTeam: boolean) => {
    if (isWhiteTeam) {
      setSelectedBlackPlayers([]);
      setSelectedWhitePlayers(prev => {
        if (prev.includes(playerId)) {
          return prev.filter(id => id !== playerId);
        } else if (prev.length >= 2) {
          return [prev[1], playerId];
        } else {
          return [...prev, playerId];
        }
      });
    } else {
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
    const whiteSelected = selectedWhitePlayers.length;
    const blackSelected = selectedBlackPlayers.length;
    
    return (whiteSelected === 2 && blackSelected === 0) || 
           (whiteSelected === 0 && blackSelected === 2) ||
           (whiteSelected === 1 && blackSelected === 1);
  };

  const handleSwap = async () => {
    if (!canSwap()) return;

    setLoading(true);
    setError(null);

    try {
      if (selectedWhitePlayers.length === 2) {
        await apiService.swapPlayers(match.id, {
          player1_id: selectedWhitePlayers[0],
          player2_id: selectedWhitePlayers[1]
        });
      } else if (selectedBlackPlayers.length === 2) {
        await apiService.swapPlayers(match.id, {
          player1_id: selectedBlackPlayers[0],
          player2_id: selectedBlackPlayers[1]
        });
      } else if (selectedWhitePlayers.length === 1 && selectedBlackPlayers.length === 1) {
        await apiService.swapPlayers(match.id, {
          player1_id: selectedWhitePlayers[0],
          player2_id: selectedBlackPlayers[0]
        });
      }

      onSwapComplete();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to swap players');
    } finally {
      setLoading(false);
    }
  };

  const getSwapDescription = () => {
    if (selectedWhitePlayers.length === 2) {
      const player1 = players.find(p => p.id === selectedWhitePlayers[0])?.name;
      const player2 = players.find(p => p.id === selectedWhitePlayers[1])?.name;
      return `Swap ${player1} ↔ ${player2}`;
    } else if (selectedBlackPlayers.length === 2) {
      const player1 = players.find(p => p.id === selectedBlackPlayers[0])?.name;
      const player2 = players.find(p => p.id === selectedBlackPlayers[1])?.name;
      return `Swap ${player1} ↔ ${player2} `;
    } 
    return 'Select players to swap';
  };

  const renderPlayerList = (teamPlayers: TeamPlayers, isWhiteTeam: boolean, selectedPlayers: number[]) => {
    const teamName = isWhiteTeam ? 'White Team' : 'Black Team';
    
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">{teamName}</h4>
        
        <div>
          <h5 className="font-medium text-sm text-gray-600 mb-2">Playing</h5>
          <div className="space-y-1">
            {teamPlayers.playing.map((player) => {
              const board = match.games.find(g => 
                isWhiteTeam ? g.white_player_id === player.id : g.black_player_id === player.id
              )?.board_number;
              
              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id, isWhiteTeam)}
                  className={`w-full text-left p-2 rounded border transition-all ${
                    selectedPlayers.includes(player.id)
                      ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-xs text-gray-500">Board {board}</span>
                  </div>
                  <div className="text-sm text-gray-600">Rating: {player.rating}</div>
                </button>
              );
            })}
          </div>
        </div>

        {teamPlayers.substitutes.length > 0 && (
          <div>
            <h5 className="font-medium text-sm text-gray-600 mb-2">Substitutes</h5>
            <div className="space-y-1">
              {teamPlayers.substitutes.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id, isWhiteTeam)}
                  className={`w-full text-left p-2 rounded border transition-all ${
                    selectedPlayers.includes(player.id)
                      ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-600">Rating: {player.rating}</div>
                </button>
              ))}
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Player Swap
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Select 2 players from the same team to swap within that team.
          </p>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">{getSwapDescription()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {renderPlayerList(whiteTeamPlayers, true, selectedWhitePlayers)}
          {renderPlayerList(blackTeamPlayers, false, selectedBlackPlayers)}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwap}
            disabled={!canSwap() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {loading ? 'Swapping...' : 'Confirm Swap'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchSwapModal;
