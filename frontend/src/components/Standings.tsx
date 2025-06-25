// frontend/src/components/Standings.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { StandingsEntry } from '@/types';

const Standings: React.FC = () => {
  const [standings, setStandings] = useState<StandingsEntry[]>([]);

  useEffect(() => {
    apiService.getStandings().then(data => setStandings(data.standings));
  }, []);

  return (
    <div>
      <h2 className="text-2xl mb-4">Standings</h2>
      <table className="w-full bg-white shadow rounded">
  <thead className="bg-gray-100">
    <tr>
      <th className="p-2">#</th>
      <th className="p-2">Team</th>
      <th className="p-2">MP</th>
      <th className="p-2">W</th>
      <th className="p-2">D</th>
      <th className="p-2">L</th>
      <th className="p-2">Match Pts</th>
      <th className="p-2">Game Pts</th>
      <th className="p-2">SB</th>
    </tr>
  </thead>
  <tbody>
    {standings.map((s, idx) => (
      <tr key={s.team_id}>
        <td className="p-2 font-semibold">{idx + 1}</td>
        <td className="p-2">{s.team_name}</td>
        <td className="p-2">{s.matches_played}</td>
        <td className="p-2">{s.wins}</td>
        <td className="p-2">{s.draws}</td>
        <td className="p-2">{s.losses}</td>
        <td className="p-2 font-semibold">{s.match_points}</td>
        <td className="p-2">{s.game_points}</td>
        <td className="p-2">{s.sonneborn_berger.toFixed(2)}</td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
};

export default Standings;
