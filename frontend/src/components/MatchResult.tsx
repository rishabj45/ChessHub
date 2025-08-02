// frontend/src/components/MatchResult.tsx
import React, { useState } from 'react';
import { X, Crown, Minus, RotateCcw } from 'lucide-react';
import { apiService } from '@/services/api';
import { MatchResponse ,Player} from '@/types';

interface MatchResultProps {
  match: MatchResponse;
  players:Player[];
  onClose: () => void;
}

const MatchResult: React.FC<MatchResultProps> = ({ match, onClose ,players }) => {
  
  const [results, setResults] = useState<{ board: number; result: string }[]>(
  match.games.map((g) => ({
    board: g.board_number,
    result: g.result || "pending"
  }))
);

  const submitResults = async () => {
  try {
    for (const r of results) {
      // Always submit the result, including "pending" to reset games
      await apiService.submitBoardResult(match.id, r.board, { result: r.result });
    }
    onClose();
  } catch (err) {
    console.error('Failed to submit match result', err);
    alert('Error submitting results');
  }
};

const getPlayerName = (id: number) =>
  players.find((p) => p.id === id)?.name || `Player ${id}`;

const toggleResult = (gameIndex: number, resultType: string) => {
  setResults((prev) => {
    const newResults = [...prev];
    // If the same result is clicked, toggle it to "pending", otherwise set the new result
    newResults[gameIndex].result = newResults[gameIndex].result === resultType ? "pending" : resultType;
    return newResults;
  });
};

const getResultIcon = (resultType: string) => {
  switch (resultType) {
    case 'white_win':
    case 'black_win':
      return <Crown className="w-4 h-4" />;
    case 'draw':
      return <Minus className="w-4 h-4" />;
    case 'pending':
      return <RotateCcw className="w-4 h-4" />;
    default:
      return null;
  }
};

const getResultButtonClass = (currentResult: string, buttonType: string) => {
  const isSelected = currentResult === buttonType;
  const baseClass = "flex items-center gap-1 px-3 py-2 rounded transition-all text-sm font-medium";
  
  switch (buttonType) {
    case 'white_win':
      return `${baseClass} ${
        isSelected 
          ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50'
      } border`;
    case 'black_win':
      return `${baseClass} ${
        isSelected 
          ? 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-300' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'
      } border`;
    case 'draw':
      return `${baseClass} ${
        isSelected 
          ? 'bg-yellow-100 border-yellow-500 text-yellow-700 ring-2 ring-yellow-300' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-yellow-50'
      } border`;
    case 'pending':
      return `${baseClass} ${
        isSelected 
          ? 'bg-gray-100 border-gray-500 text-gray-700 ring-2 ring-gray-300' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      } border`;
    default:
      return baseClass;
  }
};


return (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Match Results</h4>
        <button onClick={onClose} className="text-gray-600 hover:text-black">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {match.games.map((game, idx) => (
          <div key={game.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-semibold text-lg">Board {game.board_number}</h5>
              {game.result && game.result !== "pending" && (
                <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                  Previously: {game.result === "white_win" ? getPlayerName(game.white_player_id) : 
                              game.result === "black_win" ? getPlayerName(game.black_player_id) : 
                              game.result === "draw" ? "Draw" : "Pending"}
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">White:</span> {getPlayerName(game.white_player_id)} vs{' '}
                <span className="font-medium">Black:</span> {getPlayerName(game.black_player_id)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => toggleResult(idx, 'white_win')}
                className={getResultButtonClass(results[idx].result, 'white_win')}
              >
                {getResultIcon('white_win')}
                <span>White Wins</span>
                {results[idx].result === 'white_win' && <span className="ml-1">✓</span>}
              </button>

              <button
                onClick={() => toggleResult(idx, 'black_win')}
                className={getResultButtonClass(results[idx].result, 'black_win')}
              >
                {getResultIcon('black_win')}
                <span>Black Wins</span>
                {results[idx].result === 'black_win' && <span className="ml-1">✓</span>}
              </button>

              <button
                onClick={() => toggleResult(idx, 'draw')}
                className={getResultButtonClass(results[idx].result, 'draw')}
              >
                {getResultIcon('draw')}
                <span>Draw</span>
                {results[idx].result === 'draw' && <span className="ml-1">✓</span>}
              </button>

              <button
                onClick={() => toggleResult(idx, 'pending')}
                className={getResultButtonClass(results[idx].result, 'pending')}
              >
                {getResultIcon('pending')}
                <span>Reset</span>
                {results[idx].result === 'pending' && <span className="ml-1">✓</span>}
              </button>
            </div>

            {/* Current selection indicator */}
            <div className="mt-3 text-sm">
              <span className="font-medium">Current result: </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                results[idx].result === 'white_win' ? 'bg-green-100 text-green-800' :
                results[idx].result === 'black_win' ? 'bg-blue-100 text-blue-800' :
                results[idx].result === 'draw' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {results[idx].result === 'white_win' ? `${getPlayerName(game.white_player_id)} wins` :
                 results[idx].result === 'black_win' ? `${getPlayerName(game.black_player_id)} wins` :
                 results[idx].result === 'draw' ? 'Draw' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <div className="text-sm text-gray-600">
          Click a result button again to unselect it
        </div>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          onClick={submitResults}
        >
          Update Results
        </button>
      </div>
    </div>
  </div>
);

};

export default MatchResult;
