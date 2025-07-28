// frontend/src/components/BestPlayers.tsx
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { apiService } from '@/services/api';
import { BestPlayerEntry } from '@/types';

const BestPlayers: React.FC = () => {
  const [players, setPlayers] = useState<BestPlayerEntry[]>([]);

  useEffect(() => {
    apiService.getBestPlayers().then(data => setPlayers(data.players));
  }, []);

  return (
    <div>
      <h2 className="text-2xl mb-4">Best Players</h2>
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
              <tr key={p.player_id}>
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
  );
};

export default BestPlayers;
