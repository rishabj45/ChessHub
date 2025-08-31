// frontend/src/components/BestPlayers.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Users, ArrowUpDown } from 'lucide-react';
import { apiService } from '@/services/api';
import { BestPlayerEntry, Tournament, BestPlayersTieCheckResponse } from '@/types';

interface BestPlayersProps {
  isAdmin: boolean;
  onUpdate: () => void;
}

const BestPlayers: React.FC<BestPlayersProps> = ({ isAdmin, onUpdate }) => {
  const [players, setPlayers] = useState<BestPlayerEntry[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [validatingBestPlayers, setValidatingBestPlayers] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [finalRoundCompleted, setFinalRoundCompleted] = useState(false);
  
  // Tiebreaker state
  const [tiesData, setTiesData] = useState<BestPlayersTieCheckResponse | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [highlightedTies, setHighlightedTies] = useState<number[]>([]);
  const [loadingTiebreaker, setLoadingTiebreaker] = useState(false);
  const [tiebreakerMessage, setTiebreakerMessage] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentTournament = await apiService.getCurrentTournament();
        setTournament(currentTournament);
        
        if (currentTournament) {
          const data = await apiService.getBestPlayers(currentTournament.id);
          setPlayers(data.players);
          
          // Check if final round is completed
          try {
            const matches = await apiService.getMatches(currentTournament.id, currentTournament.total_rounds);
            const allMatchesCompleted = matches.every(match => match.is_completed);
            setFinalRoundCompleted(allMatchesCompleted);
            
            // Load tie data if final round is completed and best players not validated
            if (allMatchesCompleted && !currentTournament.best_players_validated && isAdmin) {
              const tieData = await apiService.checkBestPlayersTie(currentTournament.id);
              setTiesData(tieData);
            }
          } catch (error) {
            console.error('Error checking round completion:', error);
          }
        }
      } catch (error) {
        console.error('Error loading best players:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  const handleValidateBestPlayers = async () => {
    if (!tournament) return;
    
    setValidatingBestPlayers(true);
    setValidationError('');
    setValidationSuccess(false);
    
    try {
      await apiService.validateBestPlayers(tournament.id);
      setValidationSuccess(true);
      onUpdate(); // Refresh tournament data
      
      // Reload data to get updated tournament status
      setTimeout(async () => {
        const updatedTournament = await apiService.getCurrentTournament();
        setTournament(updatedTournament);
      }, 1000);
    } catch (error: any) {
      console.error('Error validating best players:', error);
      setValidationError(error.response?.data?.detail || 'Failed to validate best players');
    } finally {
      setValidatingBestPlayers(false);
    }
  };

  const handlePlayerClick = (playerId: number) => {
    if (!shouldShowTiebreaker()) return;
    
    if (selectedPlayer === playerId) {
      // Clicking the same player - deselect
      setSelectedPlayer(null);
      setHighlightedTies([]);
    } else if (highlightedTies.includes(playerId)) {
      // Clicking a highlighted tied player - perform swap
      if (selectedPlayer !== null) {
        handleTiebreakerSwap(selectedPlayer, playerId);
      }
    } else {
      // Clicking a new player - select and highlight ties
      setSelectedPlayer(playerId);
      const tiedPlayers = tiesData?.ties[playerId.toString()] || [];
      setHighlightedTies(tiedPlayers);
    }
  };

  const handleTiebreakerSwap = async (firstPlayerId: number, secondPlayerId: number) => {
    if (!tournament) return;
    
    setLoadingTiebreaker(true);
    setTiebreakerMessage('Swapping player positions...');
    
    try {
      await apiService.bestPlayersTiebreaker(tournament.id, {
        first_player_id: firstPlayerId,
        second_player_id: secondPlayerId
      });
      
      // Reload data
      const data = await apiService.getBestPlayers(tournament.id);
      setPlayers(data.players);
      
      const tieData = await apiService.checkBestPlayersTie(tournament.id);
      setTiesData(tieData);
      
      // Reset selection
      setSelectedPlayer(null);
      setHighlightedTies([]);
      
      setTiebreakerMessage('Player positions swapped successfully!');
      setTimeout(() => setTiebreakerMessage(''), 3000);
    } catch (error: any) {
      console.error('Error swapping players:', error);
      setTiebreakerMessage(error.response?.data?.detail || 'Failed to swap player positions');
      setTimeout(() => setTiebreakerMessage(''), 5000);
    } finally {
      setLoadingTiebreaker(false);
    }
  };

  // Helper function to get player name by ID
  const getPlayerName = (playerId: number): string => {
    const player = players.find(p => p.player_id === playerId);
    return player?.player_name || `Player ${playerId}`;
  };

  // Check if validation button should be shown
  const shouldShowValidationButton = () => {
    if (!tournament || !isAdmin || tournament.best_players_validated) {
      return false;
    }
    
    // Check if final round is completed
    return finalRoundCompleted;
  };

  // Check if tiebreaker functionality should be shown
  const shouldShowTiebreaker = () => {
    return (
      finalRoundCompleted && 
      !tournament?.best_players_validated && 
      isAdmin && 
      tiesData?.has_ties
    );
  };

  // Get styling for player row based on tiebreaker state
  const getPlayerRowStyling = (playerId: number) => {
    if (!shouldShowTiebreaker()) return '';
    
    // Selected player (highest priority)
    if (selectedPlayer === playerId) {
      return 'bg-blue-200 border-2 border-blue-500 cursor-pointer hover:bg-blue-300';
    }
    
    // Highlighted tied player (swappable) - second highest priority
    if (highlightedTies.includes(playerId)) {
      return 'bg-yellow-200 border-2 border-yellow-500 cursor-pointer hover:bg-yellow-300';
    }
    
    // Player with ties (clickable) - lowest priority
    const tiedPlayers = tiesData?.ties[playerId.toString()];
    if (tiedPlayers && tiedPlayers.length > 0) {
      return 'bg-orange-100 border border-orange-300 cursor-pointer hover:bg-orange-200';
    }
    
    return '';
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">Best Players</h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !tournament ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tournament</h2>
          </div>
        </div>
      ) : players.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Player Data Available</h2>
            <p className="text-gray-500">Player statistics will appear here once games are played.</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Validation Button and Messages */}
          {shouldShowValidationButton() && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Tournament Completed</h3>
                </div>
                <button
                  onClick={handleValidateBestPlayers}
                  disabled={validatingBestPlayers}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingBestPlayers ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Lock Best Players</span>
                    </>
                  )}
                </button>
              </div>
              
              {validationError && (
                <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
                  {validationError}
                </div>
              )}
              
              {validationSuccess && (
                <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-green-700 text-sm">
                  Best players validated successfully! Tournament is ready for completion.
                </div>
              )}
            </div>
          )}
          
          {/* Tiebreaker Messages */}
          {shouldShowTiebreaker() && tiebreakerMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2">
                {loadingTiebreaker && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                <span className="text-sm text-blue-800">{tiebreakerMessage}</span>
              </div>
            </div>
          )}
          
          {/* Tiebreaker information */}
          {shouldShowTiebreaker() && Object.keys(tiesData?.ties || {}).length > 0 && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Players with tied positions detected</span>
              </div>
              <p className="text-xs text-orange-700">
                Click on an orange-highlighted player to see which players they're tied with, then click on a yellow-highlighted player to swap their positions.
              </p>
            </div>
          )}
          
          <div className="overflow-auto max-h-96">
            <table className="w-full bg-white shadow rounded">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="p-2 bg-gray-100 text-center">#</th>
                  <th className="p-2 bg-gray-100 text-left">Player</th>
                  <th className="p-2 bg-gray-100 text-center">Games</th>
                  <th className="p-2 bg-gray-100 text-center">Wins</th>
                  <th className="p-2 bg-gray-100 text-center">Draws</th>
                  <th className="p-2 bg-gray-100 text-center">Losses</th>
                  <th className="p-2 bg-gray-100 text-center">Points</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr 
                    key={p.player_id}
                    className={`
                      ${getPlayerRowStyling(p.player_id)}
                      ${shouldShowTiebreaker() ? 'transition-colors duration-200' : ''}
                    `}
                    onClick={() => shouldShowTiebreaker() ? handlePlayerClick(p.player_id) : undefined}
                  >
                    <td className="p-2 font-semibold text-center">{i + 1}</td>
                    <td className="p-2 text-left">{p.player_name}</td>
                    <td className="p-2 text-center">{p.games_played}</td>
                    <td className="p-2 text-center">{p.wins}</td>
                    <td className="p-2 text-center">{p.draws}</td>
                    <td className="p-2 text-center">{p.losses}</td>
                    <td className="p-2 text-center">{p.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestPlayers;
