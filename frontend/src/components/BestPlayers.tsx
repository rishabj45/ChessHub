// frontend/src/components/BestPlayers.tsx
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { apiService } from '@/services/api';
import { BestPlayerEntry, Tournament } from '@/types';

const BestPlayers: React.FC = () => {
  const [players, setPlayers] = useState<BestPlayerEntry[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentTournament = await apiService.getCurrentTournament();
        setTournament(currentTournament);
        
        if (currentTournament) {
          const data = await apiService.getBestPlayers(currentTournament.id);
          setPlayers(data.players);
        }
      } catch (error) {
        console.error('Error loading best players:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tournament Available</h2>
            <p className="text-gray-500">Please create or select a tournament to view player statistics.</p>
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
      )}
    </div>
  );
};

export default BestPlayers;
