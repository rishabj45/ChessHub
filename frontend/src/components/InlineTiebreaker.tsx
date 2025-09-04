import React, { useState } from 'react';
import { apiService } from '../services/api';
import { MatchResponse, Team, Tiebreaker } from '../types';

interface InlineTiebreakerProps {
  match: MatchResponse;
  teams: Team[];
  isAdmin: boolean;
  onTiebreakerComplete: () => void;
}

const InlineTiebreaker: React.FC<InlineTiebreakerProps> = ({ 
  match, 
  teams,
  isAdmin,
  onTiebreakerComplete 
}) => {
  const [selectedWinner, setSelectedWinner] = useState<'white_win' | 'black_win' | null>(
    match.result === 'tiebreaker' && (match.tiebreaker as Tiebreaker) === 'white_win' ? 'white_win' :
    match.result === 'tiebreaker' && (match.tiebreaker as Tiebreaker) === 'black_win' ? 'black_win' : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTeamName = (teamId: number | null): string => {
    if (!teamId) return 'TBD';
    const team = teams.find(t => t.id === teamId);
    return team?.name || `Team ${teamId}`;
  };

  const whiteTeamName = getTeamName(match.white_team_id);
  const blackTeamName = getTeamName(match.black_team_id);

  const handleSelectWinner = async (winner: 'white_win' | 'black_win') => {
    if (!isAdmin) return;
    
    // Check if clicking the same team again (toggle off) or selecting a different team
    const isToggleOff = selectedWinner === winner;
    const newSelection = isToggleOff ? null : winner;
    
    // Optimistically update the UI
    setSelectedWinner(newSelection);
    setIsSubmitting(true);
    
    try {
      if (newSelection) {
        // Submit the winner selection
        await apiService.submitTiebreakerResult(match.id, {
          result: newSelection
        });
      } else {
        // For deselection, reset the tiebreaker to pending
        await apiService.submitTiebreakerResult(match.id, {
          result: 'pending'
        });
      }
      onTiebreakerComplete();
    } catch (error: any) {
      console.error('Failed to select tiebreaker winner:', error);
      alert(error.response?.data?.detail || 'Failed to select tiebreaker winner');
      // Revert the optimistic update on error
      setSelectedWinner(
        match.result === 'tiebreaker' && (match.tiebreaker as Tiebreaker) === 'white_win' ? 'white_win' :
        match.result === 'tiebreaker' && (match.tiebreaker as Tiebreaker) === 'black_win' ? 'black_win' : null
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWinnerTeamName = () => {
    if (!selectedWinner && match.tiebreaker === 'pending') return null;
    const winner = selectedWinner || match.tiebreaker;
    return winner === 'white_win' ? whiteTeamName : blackTeamName;
  };

  // Show current selection or final result
  // For admins, always allow changes. For viewers, show as completed only when the round is done
  const showAsCompleted = !isAdmin && match.result === 'tiebreaker' && (match.tiebreaker as Tiebreaker) !== 'pending' && (match.tiebreaker as Tiebreaker) !== 'no_tiebreaker';
  const hasSelection = selectedWinner !== null || (match.result === 'tiebreaker' && (match.tiebreaker as Tiebreaker) !== 'pending' && (match.tiebreaker as Tiebreaker) !== 'no_tiebreaker');

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
      <div className="flex items-center mb-3">
        <span className="font-semibold text-yellow-800">⚔️ Tiebreaker </span>
      </div>
      
      {showAsCompleted ? (
        <div className="text-green-700 font-medium">
          🏆 Winner: <strong>{getWinnerTeamName()}</strong>
        </div>
      ) : (
        <div className="space-y-2">
          {isAdmin ? (
            <>
              <p className="text-sm text-gray-700 mb-3">
                Select Armageddon winner
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSelectWinner('white_win')}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded border font-medium transition-all ${
                    selectedWinner === 'white_win'
                      ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">♔</span>
                    <span>{whiteTeamName}</span>
                    {selectedWinner === 'white_win' && (
                      <span className="ml-2">✓</span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSelectWinner('black_win')}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded border font-medium transition-all ${
                    selectedWinner === 'black_win'
                      ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">♚</span>
                    <span>{blackTeamName}</span>
                    {selectedWinner === 'black_win' && (
                      <span className="ml-2">✓</span>
                    )}
                  </div>
                </button>
              </div>
            </>
          ) : (
            // Viewer mode - simple status
            <div>
              {hasSelection ? (
                <div className="text-blue-700 font-medium">
                  🏆 Winner: <strong>{getWinnerTeamName()}</strong>
                </div>
              ) : (
                <p className="text-gray-600">
                  Awaiting tiebraker winner 
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineTiebreaker;
