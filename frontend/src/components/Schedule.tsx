import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { MatchResponse, Player, Team, Tournament, GameResponse } from '@/types';
import MatchResult from './MatchResult';
import PlayerSwapModal from './PlayerSwapModal';

interface ScheduleProps {
  isAdmin: boolean;
  tournament: Tournament | null;
  onUpdate: () => void;
}

const Schedule: React.FC<ScheduleProps> = ({ isAdmin, tournament, onUpdate }) => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(null);
  const [selectedGameForSwap, setSelectedGameForSwap] = useState<{
    match: MatchResponse;
    game: GameResponse;
  } | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>({});
  const [roundTimes, setRoundTimes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!tournament) return;

      try {
        setLoading(true);
        const allMatches: MatchResponse[] = [];

        for (let round = 1; round <= tournament.total_rounds; round++) {
          const res = await apiService.getMatches(round);
          allMatches.push(...res);
        }

        const [allPlayers, allTeams] = await Promise.all([
          apiService.getPlayers(),
          apiService.getTeams(),
        ]);

        setMatches(allMatches);
        setPlayers(allPlayers);
        setTeams(allTeams);

        const roundTimeMap: Record<number, string> = {};
        allMatches.forEach((m) => {
          if (m.scheduled_date && !roundTimeMap[m.round_number]) {
            roundTimeMap[m.round_number] = new Date(m.scheduled_date).toISOString().slice(0, 16);
          }
        });
        setRoundTimes(roundTimeMap);

        setError(null);
      } catch (err) {
        console.error('Failed to load schedule:', err);
        setError('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tournament, onUpdate]);

  const getPlayer = (id: number) => players.find((p) => p.id === id);
  const getTeamName = (id: number) => teams.find((t) => t.id === id)?.name || `Team ${id}`;

  const groupedByRound = matches.reduce((acc, match) => {
    acc[match.round_number] = acc[match.round_number] || [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, MatchResponse[]>);

  const formatScore = (result: string | null | undefined) => {
    if (!result || result === 'pending') return '–';

    const score: [number, number] =
      result === 'white_win' ? [1, 0] :
      result === 'black_win' ? [0, 1] :
      result === 'draw' ? [0.5, 0.5] : [0, 0];

    return `${score[0]}–${score[1]}` ;
  };

  const handleSwapComplete = () => {
    // Refresh the data after a successful swap
    onUpdate();
  };

  if (loading) return <div>Loading schedule...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl mb-4">Schedule</h2>

      {Object.entries(groupedByRound).map(([roundStr, roundMatches]) => {
        const round = Number(roundStr);
        const roundTime = roundTimes[round];

        return (
          <div key={round} className="mb-6 border rounded shadow bg-gray-50">
            <div className="flex justify-between items-center bg-gray-200 px-4 py-2">
              <h3 className="text-lg font-semibold">Round {round}</h3>
              <div className="flex items-center gap-4">
                {isAdmin ? (
                  <input
                    type="datetime-local"
                    value={roundTime || ''}
                    onChange={async (e) => {
                      const newTime = e.target.value;
                      setRoundTimes((prev) => ({ ...prev, [round]: newTime }));
                      try {
                        await apiService.rescheduleRound(round, newTime);
                        onUpdate();
                      } catch {
                        alert('Failed to update round schedule');
                      }
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="text-sm text-gray-700">
                    {roundTime ? new Date(roundTime).toLocaleString() : 'TBD'}
                  </span>
                )}
              </div>
            </div>

            {roundMatches.map((match) => {
              const expanded = expandedMatches[match.id] ?? false;

              return (
                <div key={match.id} className="bg-white p-4 border-b">
                  <div
                    className="flex justify-between items-center mb-2 cursor-pointer"
                    onClick={() =>
                      setExpandedMatches((prev) => ({
                        ...prev,
                        [match.id]: !prev[match.id],
                      }))
                    }
                  >
                    <p className="text-lg font-semibold">
                      {getTeamName(match.white_team_id)} vs {getTeamName(match.black_team_id)} (
                      {match.white_score ?? 0}–{match.black_score ?? 0})
                    </p>
                    <span className="text-sm text-blue-600">
                      {expanded ? 'Hide Boards ▲' : 'Show Boards ▼'}
                    </span>
                  </div>

                  {expanded && (
                    <div className="text-sm grid gap-2">
                      {match.games.map((game) => {
                        const board = game.board_number;
                        const whitePlayer = getPlayer(game.white_player_id);
                        const blackPlayer = getPlayer(game.black_player_id);

                        const leftIcon = board === 1 || board === 3 ? '♔' : '♚';
                        const rightIcon = board === 1 || board === 3 ? '♚' : '♔';

                        return (
                          <div key={game.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex gap-2 items-center w-1/2">
                              <span>{leftIcon}</span>
                              <span>{whitePlayer?.name || 'Unknown'}</span>
                            </div>
                            <div className="text-center text-gray-700 w-20">
                              {formatScore(game.result)}
                            </div>
                            <div className="flex gap-2 justify-end items-center w-1/2 text-right">
                              <span>{blackPlayer?.name || 'Unknown'}</span>
                              <span>{rightIcon}</span>
                            </div>
                            
                            {/* Admin controls for each game */}
                            {isAdmin && !match.is_completed && (
                              <div className="flex gap-1 ml-2">
                                <button
                                  className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedGameForSwap({ match, game });
                                  }}
                                  title="Swap players for this board"
                                >
                                  Swap
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isAdmin && (
                        <div className="flex justify-end mt-2 gap-2">
                          <button
                            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMatch(match);
                            }}
                          >
                            Enter Results
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Match Result Modal */}
      {selectedMatch && (
        <MatchResult
          match={selectedMatch}
          players={players}
          onClose={() => {
            setSelectedMatch(null);
            onUpdate();
          }}
        />
      )}

      {/* Player Swap Modal */}
      {selectedGameForSwap && (
        <PlayerSwapModal
          match={selectedGameForSwap.match}
          game={selectedGameForSwap.game}
          isOpen={!!selectedGameForSwap}
          onClose={() => setSelectedGameForSwap(null)}
          onSwapComplete={handleSwapComplete}
          players={players}
          teams={teams}
        />
      )}
    </div>
  );
};

export default Schedule;