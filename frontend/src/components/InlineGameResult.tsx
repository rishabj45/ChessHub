import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { GameResponse } from '@/types';

interface InlineGameResultProps {
  game: GameResponse;
  matchId: number;
  isAdmin: boolean;
  whitePlayerName: string;
  blackPlayerName: string;
  onResultUpdate?: () => void;
}

const InlineGameResult: React.FC<InlineGameResultProps> = ({ 
  game, 
  matchId, 
  isAdmin, 
  whitePlayerName,
  blackPlayerName,
  onResultUpdate 
}) => {
  const [currentResult, setCurrentResult] = useState<string>(game.result || 'pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when game result changes (e.g., after color swap)
  useEffect(() => {
    setCurrentResult(game.result || 'pending');
  }, [game.result]);

  const handleResultSelect = async (resultType: string) => {
    if (!isAdmin || isSubmitting) return;
    
    // Toggle functionality: if same result is clicked, set to pending
    const newResult = currentResult === resultType ? 'pending' : resultType;
    
    setIsSubmitting(true);
    try {
      await apiService.submitBoardResult(matchId, game.board_number, { result: newResult });
      setCurrentResult(newResult);
      onResultUpdate?.();
    } catch (error) {
      console.error('Failed to update game result:', error);
      alert('Failed to update result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResultText = (resultType: string) => {
    switch (resultType) {
      case 'white_win':
        return whitePlayerName.split(' ')[0]; // First name only for space
      case 'black_win':
        return blackPlayerName.split(' ')[0]; // First name only for space
      case 'draw':
        return 'Draw';
      case 'pending':
        return '–';
      default:
        return '–';
    }
  };

  const getButtonClass = (buttonType: string) => {
    const isSelected = currentResult === buttonType;
    const baseClass = "flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all min-w-[60px]";
    
    if (isSubmitting) {
      return `${baseClass} opacity-50 cursor-not-allowed bg-gray-100 text-gray-500`;
    }
    
    switch (buttonType) {
      case 'white_win':
        return `${baseClass} ${
          isSelected 
            ? 'bg-green-100 border border-green-500 text-green-700 ring-1 ring-green-300' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50'
        }`;
      case 'black_win':
        return `${baseClass} ${
          isSelected 
            ? 'bg-blue-100 border border-blue-500 text-blue-700 ring-1 ring-blue-300' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
        }`;
      case 'draw':
        return `${baseClass} ${
          isSelected 
            ? 'bg-yellow-100 border border-yellow-500 text-yellow-700 ring-1 ring-yellow-300' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-yellow-50'
        }`;
      default:
        return baseClass;
    }
  };

  const formatScoreDisplay = () => {
    switch (currentResult) {
      case 'white_win':
        return '1–0';
      case 'black_win':
        return '0–1';
      case 'draw':
        return '½–½';
      case 'pending':
      default:
        return '–';
    }
  };

  if (!isAdmin) {
    // Viewer mode - just show the current score
    return (
      <div className="text-center text-gray-700 w-20">
        {formatScoreDisplay()}
      </div>
    );
  }

  // Admin mode - show interactive buttons
  return (
    <div className="flex gap-1 justify-center w-auto">
      <button
        onClick={() => handleResultSelect('white_win')}
        disabled={isSubmitting}
        className={getButtonClass('white_win')}
        title={`${whitePlayerName} wins`}
      >
        {getResultText('white_win')}
        {currentResult === 'white_win' && <span className="ml-1">✓</span>}
      </button>
      
      <button
        onClick={() => handleResultSelect('draw')}
        disabled={isSubmitting}
        className={getButtonClass('draw')}
        title="Draw"
      >
        {getResultText('draw')}
        {currentResult === 'draw' && <span className="ml-1">✓</span>}
      </button>
      
      <button
        onClick={() => handleResultSelect('black_win')}
        disabled={isSubmitting}
        className={getButtonClass('black_win')}
        title={`${blackPlayerName} wins`}
      >
        {getResultText('black_win')}
        {currentResult === 'black_win' && <span className="ml-1">✓</span>}
      </button>
    </div>
  );
};

export default InlineGameResult;
