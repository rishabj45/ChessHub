import React, { useState } from 'react';
import { X, Crown, Minus, RotateCcw } from 'lucide-react';
import { apiService } from '../services/api';
import { MatchResponse, Player } from '../types';
import type { MatchResult } from '../types';

interface MatchResultProps {
  match: MatchResponse;
  players: Player[];
  onClose: () => void;
  onUpdate: () => void;
}

const MatchResult: React.FC<MatchResultProps> = ({ match, players, onClose, onUpdate }) => {
  const [results, setResults] = useState<{ board: number; result: MatchResult }[]>(
    match.games.map((game) => ({
      board: game.board_number,
      result: game.result || 'pending'
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPlayerName = (id: number) =>
    players.find((p) => p.id === id)?.name || `Player ${id}`;

  const submitResults = async () => {
    setIsSubmitting(true);
    try {
      for (const result of results) {
        await apiService.submitBoardResult(match.id, result.board, { result: result.result });
      }
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to submit match results:', err);
      alert('Error submitting results');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateResult = (gameIndex: number, resultType: MatchResult) => {
    setResults((prev) => {
      const newResults = [...prev];
      newResults[gameIndex].result = newResults[gameIndex].result === resultType ? 'pending' : resultType;
      return newResults;
    });
  };

  const getResultIcon = (resultType: MatchResult) => {
    switch (resultType) {
      case 'white_win':
      case 'black_win':
        return <Crown className="w-4 h-4" />;
      case 'draw':
        return <Minus className="w-4 h-4" />;
      default:
        return <RotateCcw className="w-4 h-4" />;
    }
  };

  const getButtonClass = (currentResult: MatchResult, buttonType: MatchResult) => {
    const isSelected = currentResult === buttonType;
    const baseClass = "flex items-center gap-1 px-3 py-2 rounded transition-all text-sm font-medium border";
    
    if (isSelected) {
      switch (buttonType) {
        case 'white_win':
          return `${baseClass} bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300`;
        case 'black_win':
          return `${baseClass} bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-300`;
        case 'draw':
          return `${baseClass} bg-yellow-100 border-yellow-500 text-yellow-700 ring-2 ring-yellow-300`;
        default:
          return `${baseClass} bg-gray-100 border-gray-500 text-gray-700 ring-2 ring-gray-300`;
      }
    }
    
    return `${baseClass} bg-white border-gray-300 text-gray-700 hover:bg-gray-50`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-xl">Match Results</h4>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {match.games.map((game, index) => {
            const whitePlayer = getPlayerName(game.white_player_id);
            const blackPlayer = getPlayerName(game.black_player_id);
            const currentResult = results[index]?.result || 'pending';

            return (
              <div key={game.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold text-lg">Board {game.board_number}</h5>
                  <span className="text-sm text-gray-500">Game ID: {game.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-white border border-gray-400 rounded-sm"></span>
                    <span className="font-medium">{whitePlayer}</span>
                    <span className="text-gray-500">(White)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-gray-800 border border-gray-400 rounded-sm"></span>
                    <span className="font-medium">{blackPlayer}</span>
                    <span className="text-gray-500">(Black)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => updateResult(index, 'white_win')}
                    className={getButtonClass(currentResult, 'white_win')}
                  >
                    {getResultIcon('white_win')}
                    White Wins
                  </button>
                  
                  <button
                    onClick={() => updateResult(index, 'draw')}
                    className={getButtonClass(currentResult, 'draw')}
                  >
                    {getResultIcon('draw')}
                    Draw
                  </button>
                  
                  <button
                    onClick={() => updateResult(index, 'black_win')}
                    className={getButtonClass(currentResult, 'black_win')}
                  >
                    {getResultIcon('black_win')}
                    Black Wins
                  </button>
                  
                  <button
                    onClick={() => updateResult(index, 'pending')}
                    className={getButtonClass(currentResult, 'pending')}
                  >
                    {getResultIcon('pending')}
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitResults}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchResult;
