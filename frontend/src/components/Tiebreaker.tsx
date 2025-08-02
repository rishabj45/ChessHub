import React, { useState } from 'react';
import { apiService } from '@/services/api';
import { TiebreakerResponse } from '@/types';

interface TiebreakerProps {
  tiebreaker: TiebreakerResponse;
  whiteTeamName: string;
  blackTeamName: string;
  isAdmin: boolean;
  onTiebreakerComplete: () => void;
}

const Tiebreaker: React.FC<TiebreakerProps> = ({ 
  tiebreaker, 
  whiteTeamName, 
  blackTeamName, 
  isAdmin,
  onTiebreakerComplete 
}) => {
  const [selectedWinner, setSelectedWinner] = useState<number | null>(
    tiebreaker.winner_team_id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectWinner = async (teamId: number) => {
    if (!isAdmin || tiebreaker.is_completed) return;
    
    // Check if clicking the same team again (toggle off)
    const currentWinner = selectedWinner || tiebreaker.winner_team_id;
    const isToggleOff = currentWinner === teamId;
    
    // Optimistically update the UI
    setSelectedWinner(isToggleOff ? null : teamId);
    setIsSubmitting(true);
    
    try {
      await apiService.selectTiebreakerWinner(tiebreaker.id, teamId);
      onTiebreakerComplete();
    } catch (error) {
      console.error('Failed to select tiebreaker winner:', error);
      alert('Failed to select tiebreaker winner');
      // Revert the optimistic update on error
      setSelectedWinner(tiebreaker.winner_team_id || null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWinnerTeamName = () => {
    if (!selectedWinner && !tiebreaker.winner_team_id) return null;
    const winnerId = selectedWinner || tiebreaker.winner_team_id;
    return winnerId === tiebreaker.white_team_id 
      ? whiteTeamName 
      : blackTeamName;
  };

  // Show current selection or final result
  // Only show as completed if the tiebreaker is actually marked as completed (when round is done)
  const showAsCompleted = tiebreaker.is_completed;
  const hasSelection = selectedWinner !== null || tiebreaker.winner_team_id !== null;

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
                Select Armageddon winner (click again to deselect):
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSelectWinner(tiebreaker.white_team_id)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded border font-medium transition-all ${
                    selectedWinner === tiebreaker.white_team_id
                      ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {whiteTeamName}
                  {selectedWinner === tiebreaker.white_team_id && (
                    <span className="ml-2">✓</span>
                  )}
                </button>
                <button
                  onClick={() => handleSelectWinner(tiebreaker.black_team_id)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded border font-medium transition-all ${
                    selectedWinner === tiebreaker.black_team_id
                      ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {blackTeamName}
                  {selectedWinner === tiebreaker.black_team_id && (
                    <span className="ml-2">✓</span>
                  )}
                </button>
              </div>
              {hasSelection && (
                <p className="text-sm text-blue-600 mt-2">
                  💡 Click the selected team again to deselect
                </p>
              )}
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
                  Awaiting winner
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tiebreaker;
