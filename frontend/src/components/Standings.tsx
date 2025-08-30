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
  const [groupStandings, setGroupStandings] = useState<{ group_a: StandingsEntry[], group_b: StandingsEntry[] }>({ group_a: [], group_b: [] });
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentTournament = await apiService.getCurrentTournament();
        setTournament(currentTournament);

        if (currentTournament) {
          const standingsData = await apiService.getStandings(currentTournament.id);
          setStandings(standingsData.standings);
          
          // Group standings by group number for group_knockout format
          if (currentTournament.format === 'group_knockout') {
            const groupA = standingsData.standings.filter(s => s.group === 1);
            const groupB = standingsData.standings.filter(s => s.group === 2);
            setGroupStandings({ group_a: groupA, group_b: groupB });
          }
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
      <div className="overflow-auto max-h-96">
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 bg-gray-100 text-center">#</th>
              <th className="p-2 bg-gray-100 text-left">Team</th>
              <th className="p-2 bg-gray-100 text-center">MP</th>
              <th className="p-2 bg-gray-100 text-center">W</th>
              <th className="p-2 bg-gray-100 text-center">D</th>
              <th className="p-2 bg-gray-100 text-center">L</th>
              <th className="p-2 bg-gray-100 text-center">Match Pts</th>
              <th className="p-2 bg-gray-100 text-center">Game Pts</th>
              <th className="p-2 bg-gray-100 text-center">SB</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr key={team.team_id} className={idx < 2 ? 'bg-green-100 border-l-4 border-green-500' : ''}>
                <td className="p-2 font-semibold text-center">{idx + 1}</td>
                <td className="p-2 text-left">{team.team_name}</td>
                <td className="p-2 text-center">{team.matches_played}</td>
                <td className="p-2 text-center">{team.wins}</td>
                <td className="p-2 text-center">{team.draws}</td>
                <td className="p-2 text-center">{team.losses}</td>
                <td className="p-2 font-semibold text-center">{team.match_points}</td>
                <td className="p-2 text-center">{team.game_points}</td>
                <td className="p-2 text-center">{team.sonneborn_berger?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl mb-4">Standings</h2>
      
      {!tournament ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tournament Available</h2>
            <p className="text-gray-500">Please create or select a tournament to view standings.</p>
          </div>
        </div>
      ) : tournament?.format === 'group_knockout' ? (
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
                <p>• {groupStandings.group_a[0]?.team_name} (A1) vs {groupStandings.group_b[1]?.team_name} (B2)</p>
                <p>• {groupStandings.group_a[1]?.team_name} (A2) vs {groupStandings.group_b[0]?.team_name} (B1)</p>
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
          
          <div className="overflow-auto max-h-96">
            <table className="w-full bg-white shadow rounded">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="p-2 bg-gray-100 text-center">#</th>
                  <th className="p-2 bg-gray-100 text-left">Team</th>
                  <th className="p-2 bg-gray-100 text-center">MP</th>
                  <th className="p-2 bg-gray-100 text-center">W</th>
                  <th className="p-2 bg-gray-100 text-center">D</th>
                  <th className="p-2 bg-gray-100 text-center">L</th>
                  <th className="p-2 bg-gray-100 text-center">Match Pts</th>
                  <th className="p-2 bg-gray-100 text-center">Game Pts</th>
                  <th className="p-2 bg-gray-100 text-center">SB</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => (
                  <tr key={s.team_id}>
                    <td className="p-2 font-semibold text-center">{idx + 1}</td>
                    <td className="p-2 text-left">{s.team_name}</td>
                    <td className="p-2 text-center">{s.matches_played}</td>
                    <td className="p-2 text-center">{s.wins}</td>
                    <td className="p-2 text-center">{s.draws}</td>
                    <td className="p-2 text-center">{s.losses}</td>
                    <td className="p-2 font-semibold text-center">{s.match_points}</td>
                    <td className="p-2 text-center">{s.game_points}</td>
                    <td className="p-2 text-center">{s.sonneborn_berger.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Standings;
