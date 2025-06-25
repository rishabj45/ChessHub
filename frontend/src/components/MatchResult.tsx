// frontend/src/components/MatchResult.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
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
      if (r.result !== "pending") {
        await apiService.submitBoardResult(match.id, r.board, { result: r.result });
      }
    }
    onClose();
  } catch (err) {
    console.error('Failed to submit match result', err);
    alert('Error submitting results');
  }
};

const getPlayerName = (id: number) =>
  players.find((p) => p.id === id)?.name || `Player ${id}`;


return (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white w-full max-w-md p-4 rounded shadow-md mx-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-lg">Match Results</h4>
        <button onClick={onClose} className="text-gray-600 hover:text-black">
          <X />
        </button>
      </div>

      {match.games.map((game, idx) => (
        <div key={game.id} className="flex items-center mb-3 space-x-2">
          <span className="w-24">Board {game.board_number}:</span>
          <select
            className="border px-2 py-1 rounded"
            value={results[idx].result}
            onChange={(e) => {
              const val = e.target.value;
              setResults((prev) => {
                const nr = [...prev];
                nr[idx].result = val;
                return nr;
              });
            }}
          >
            <option value="pending">Pending</option>
            <option value="white_win">{getPlayerName(game.white_player_id)} </option>
            <option value="black_win">{getPlayerName(game.black_player_id)} </option>
            <option value="draw">Draw</option>
          </select>
          {game.result && (
            <span className="text-xs text-green-600">
              was:{" "}
              {game.result === "white_win"
                ? getPlayerName(game.white_player_id)
                : game.result === "black_win"
                ? getPlayerName(game.black_player_id)
                : game.result === "draw"
                ? "Draw"
                : "Pending"}
              
            </span>
          )}
        </div>
      ))}

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={submitResults}
      >
        Submit Results
      </button>
    </div>
  </div>
);

};

export default MatchResult;
