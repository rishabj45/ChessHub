// frontend/src/components/Standings.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { StandingsEntry, Tournament } from '@/types';

interface StandingsProps {
  isAdmin: boolean;
  onUpdate: () => void;
}

const Standings: React.FC<StandingsProps> = ({ isAdmin, onUpdate }) => {
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [groupStandings, setGroupStandings] = useState<{ group_a: any[], group_b: any[] }>({ group_a: [], group_b: [] });
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentTournament = await apiService.getCurrentTournament();
        setTournament(currentTournament);

        if (currentTournament?.format === 'group_knockout') {
          const groupData = await apiService.getGroupStandings();
          setGroupStandings(groupData);
        } else {
          const standingsData = await apiService.getStandings();
          setStandings(standingsData.standings);
        }
      } catch (error) {
        console.error('Error loading standings:', error);
      }
    };

    loadData();
  }, []);

  const renderGroupStandings = (groupName: string, teams: any[]) => (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">Group {groupName}</h3>
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
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => (
            <tr key={team.id} className={idx < 2 ? 'bg-green-50' : ''}>
              <td className="p-2 font-semibold">{idx + 1}</td>
              <td className="p-2">{team.name}</td>
              <td className="p-2">{team.matches_played}</td>
              <td className="p-2">{team.wins}</td>
              <td className="p-2">{team.draws}</td>
              <td className="p-2">{team.losses}</td>
              <td className="p-2 font-semibold">{team.match_points}</td>
              <td className="p-2">{team.game_points}</td>
              <td className="p-2">{team.sonneborn_berger?.toFixed(2)}</td>
              <td className="p-2">
                {idx === 0 && <span className="text-green-600 font-semibold">1st - Qualified</span>}
                {idx === 1 && <span className="text-green-600 font-semibold">2nd - Qualified</span>}
                {idx > 1 && <span className="text-gray-500">Eliminated</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl mb-4">Standings</h2>
      
      {tournament?.format === 'group_knockout' ? (
        <div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              <strong>Group + Knockout Format:</strong> Top 2 teams from each group advance to semi-finals
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {renderGroupStandings('A', groupStandings.group_a)}
            </div>
            <div>
              {renderGroupStandings('B', groupStandings.group_b)}
            </div>
          </div>
          
          {groupStandings.group_a.length > 0 && groupStandings.group_b.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
              <h3 className="text-lg font-semibold mb-2">Knockout Bracket</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Semi-finals:</strong></p>
                <p>• {groupStandings.group_a[0]?.name} (A1) vs {groupStandings.group_b[1]?.name} (B2)</p>
                <p>• {groupStandings.group_a[1]?.name} (A2) vs {groupStandings.group_b[0]?.name} (B1)</p>
                <p className="mt-2"><strong>Final:</strong> Winners of semi-finals</p>
                <p><strong>3rd Place:</strong> Losers of semi-finals</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              <strong>Round Robin Format:</strong> All teams play against each other once
            </p>
          </div>
          
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
      )}
    </div>
  );
};

export default Standings;
