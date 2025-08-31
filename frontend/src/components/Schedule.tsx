import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Users, RotateCcw, Crown, Trophy, Medal, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import { apiService } from '../services/api';
import { MatchResponse, Player, Team, Tournament, TieCheckResponse} from '../types';
import MatchSwapModal from './MatchSwapModal';
import InlineGameResult from './InlineGameResult';

interface ScheduleProps {
  isAdmin: boolean;
  tournament: Tournament | null;
  onUpdate: () => void;
}

interface TiebreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (firstTeamId: number, secondTeamId: number) => void;
  teams: { id: number; name: string }[];
  tieGroup: { position: number; teams: { id: number; name: string }[] };
}

interface RoundCompletionStatus {
  can_complete: boolean;
  unfinished_matches: number;
  total_matches: number;
}

const TiebreakerModal: React.FC<TiebreakerModalProps> = ({ isOpen, onClose, onResolve, teams, tieGroup }) => {
  const [firstTeam, setFirstTeam] = useState<number | null>(null);
  const [secondTeam, setSecondTeam] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleResolve = () => {
    if (firstTeam !== null && secondTeam !== null) {
      onResolve(firstTeam, secondTeam);
      setFirstTeam(null);
      setSecondTeam(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Resolve Tiebreaker</h3>
        <p className="text-gray-600 mb-4">
          Position {tieGroup.position}: Select which team should be ranked higher
        </p>
        
        <div className="space-y-3 mb-6">
          {tieGroup.teams.map((team) => (
            <div key={team.id} className="flex items-center space-x-3">
              <input
                type="radio"
                id={`first-${team.id}`}
                name="firstTeam"
                value={team.id}
                checked={firstTeam === team.id}
                onChange={() => setFirstTeam(team.id)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor={`first-${team.id}`} className="font-medium">
                {team.name} (Higher Rank)
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-6">
          {tieGroup.teams.map((team) => (
            <div key={team.id} className="flex items-center space-x-3">
              <input
                type="radio"
                id={`second-${team.id}`}
                name="secondTeam"
                value={team.id}
                checked={secondTeam === team.id}
                onChange={() => setSecondTeam(team.id)}
                className="w-4 h-4 text-red-600"
              />
              <label htmlFor={`second-${team.id}`} className="font-medium">
                {team.name} (Lower Rank)
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!firstTeam || !secondTeam || firstTeam === secondTeam}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resolve Tiebreaker
          </button>
        </div>
      </div>
    </div>
  );
};

const Schedule: React.FC<ScheduleProps> = ({ isAdmin, tournament, onUpdate }) => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchForSwap, setSelectedMatchForSwap] = useState<MatchResponse | null>(null);
  
  // Initialize expandedMatches from localStorage
  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('chesshub-expanded-matches');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [roundTimes, setRoundTimes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundCompletionStatus, setRoundCompletionStatus] = useState<Record<number, RoundCompletionStatus>>({});
  const [completingRound, setCompletingRound] = useState<number | null>(null);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  const [tieData, setTieData] = useState<TieCheckResponse | null>(null);
  const [showTiebreakerModal, setShowTiebreakerModal] = useState(false);
  const [currentTieGroup, setCurrentTieGroup] = useState<{ position: number; teams: { id: number; name: string }[] } | null>(null);

  // Professional scroll restoration approach with multiple fallback strategies
  const preserveScrollPosition = (callback: () => void) => {
    const scrollY = window.pageYOffset;
    const scrollX = window.pageXOffset;
    
    // Find the currently visible round for context preservation
    const visibleRound = Object.keys(groupedByRound).find(roundStr => {
      const element = document.getElementById(`round-${roundStr}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 0;
      }
      return false;
    });
    
    // Disable smooth scrolling temporarily
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    
    callback();
    
    // Multi-layered restoration strategy
    const restoreScroll = () => {
      // Try exact position first
      window.scrollTo(scrollX, scrollY);
      
      // Fallback: if position seems off, try to maintain round context
      setTimeout(() => {
        if (Math.abs(window.pageYOffset - scrollY) > 50 && visibleRound) {
          const element = document.getElementById(`round-${visibleRound}`);
          if (element) {
            // Calculate target position with header offset directly
            const elementTop = element.offsetTop;
            const headerOffset = 80;
            const targetPosition = Math.max(0, elementTop - headerOffset);
            window.scrollTo({ top: targetPosition, behavior: 'auto' });
          }
        }
      }, 50);
    };
    
    // Multiple restoration attempts with different timings
    requestAnimationFrame(() => {
      restoreScroll();
      setTimeout(() => {
        restoreScroll();
        setTimeout(() => {
          restoreScroll();
          // Restore original scroll behavior
          document.documentElement.style.scrollBehavior = originalScrollBehavior;
        }, 100);
      }, 10);
    });
  };

  // Function to refresh only match data without full tournament refresh
  const refreshMatchData = async () => {
    if (!tournament) return;
    
    try {
      const allMatches: MatchResponse[] = [];
      for (let round = 1; round <= tournament.total_rounds; round++) {
        const res = await apiService.getMatches(tournament.id, round);
        allMatches.push(...res);
      }
      setMatches(allMatches);
      
      // Also refresh round completion status for current round
      const currentRound = tournament.current_round;
      if (currentRound > 0 && isAdmin) {
        await checkRoundCompletionStatus(currentRound);
      }
    } catch (err) {
      console.error('Failed to refresh match data:', err);
    }
  };

  // Function to update expandedMatches with persistence
  const updateExpandedMatches = (updater: (prev: Record<number, boolean>) => Record<number, boolean>) => {
    setExpandedMatches((prev) => {
      const newState = updater(prev);
      try {
        localStorage.setItem('chesshub-expanded-matches', JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to save expanded matches to localStorage:', error);
      }
      return newState;
    });
  };

  const getRoundType = (roundNumber: number): 'group' | 'knockout' => {
    if (!tournament || tournament.format !== 'group_knockout') {
      return 'group'; // Default for round-robin and swiss
    }

    // Calculate group stage rounds
    // For group+knockout, group stage is first several rounds, then knockout
    if (tournament.total_rounds >= 2) {
      const knockoutRounds = 2; // Semi-finals, Final (with 3rd place in same round)
      const groupRounds = tournament.total_rounds - knockoutRounds;
      return roundNumber <= groupRounds ? 'group' : 'knockout';
    }
    
    return 'group';
  };

  const getRoundTitle = (roundNumber: number): string => {
    const roundType = getRoundType(roundNumber);
    
    if (roundType === 'group') {
      return `Round ${roundNumber} (Group Stage)`;
    } else {
      // Knockout rounds
      const totalRounds = tournament?.total_rounds || 0;
      if (roundNumber === totalRounds - 1) {
        return `Round ${roundNumber} (Semi-Finals)`;
      } else if (roundNumber === totalRounds) {
        return `Round ${roundNumber} (Finals)`;
      } else {
        return `Round ${roundNumber} (Knockout)`;
      }
    }
  };

  const getMatchLabel = (match: MatchResponse): string => {
    if (match.label && match.label !== 'group') {
      const labelMap: Record<string, string> = {
        'SF1': 'Semi-Final 1',
        'SF2': 'Semi-Final 2',
        'Final': 'Final',
        '3rd Place': '3rd Place Match'
      };
      return labelMap[match.label] || match.label;
    }
    return '';
  };

  const getMatchIcon = (match: MatchResponse) => {
    if (match.label === 'Final') return <Crown className="w-4 h-4 text-yellow-500" />;
    if (match.label === '3rd Place') return <Medal className="w-4 h-4 text-amber-600" />;
    if (match.label === 'SF1' || match.label === 'SF2') return <Trophy className="w-4 h-4 text-blue-500" />;
    return null;
  };

  // Check if round can be completed
  const checkRoundCompletionStatus = async (roundNumber: number) => {
    if (!tournament || !isAdmin) return;

    try {
      const roundMatches = matches.filter(m => m.round_number === roundNumber);
      const unfinishedMatches = roundMatches.filter(m => !m.is_completed).length;
      const totalMatches = roundMatches.length;
      
      setRoundCompletionStatus(prev => ({
        ...prev,
        [roundNumber]: {
          can_complete: unfinishedMatches === 0,
          unfinished_matches: unfinishedMatches,
          total_matches: totalMatches
        }
      }));
    } catch (error) {
      console.error('Failed to check round completion status:', error);
    }
  };

  const loadSchedule = async () => {
    if (!tournament) return;

    try {
      setLoading(true);
      setError(null);

      const [playersRes, teamsRes] = await Promise.all([
        apiService.getPlayers(tournament.id),
        apiService.getTeams(tournament.id)
      ]);

      setPlayers(playersRes);
      setTeams(teamsRes);

      const allMatches: MatchResponse[] = [];
      const times: Record<number, string> = {};

      for (let round = 1; round <= tournament.total_rounds; round++) {
        const res = await apiService.getMatches(tournament.id, round);
        allMatches.push(...res);
        
        // Extract round start times
        if (res.length > 0 && res[0].start_date) {
          times[round] = res[0].start_date;
        }
      }

      setMatches(allMatches);
      setRoundTimes(times);

      // Check round completion status for all rounds
      if (isAdmin) {
        for (let round = 1; round <= tournament.total_rounds; round++) {
          await checkRoundCompletionStatus(round);
        }
      }

      // Check for ties in standings
      if (tournament.stage === 'group' && isAdmin) {
        try {
          const tieCheckRes = await apiService.checkStandingsTie(tournament.id);
          setTieData(tieCheckRes);
        } catch (error) {
          console.warn('Failed to check standings ties:', error);
        }
      }

    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [tournament, isAdmin]);

  // Auto-scroll to current round on initial load
  useEffect(() => {
    if (!loading && !hasInitiallyScrolled && tournament && tournament.current_round > 0) {
      setTimeout(() => {
        const currentRoundElement = document.getElementById(`round-${tournament.current_round}`);
        if (currentRoundElement) {
          const headerOffset = 80;
          const elementTop = currentRoundElement.offsetTop;
          const targetPosition = Math.max(0, elementTop - headerOffset);
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
        setHasInitiallyScrolled(true);
      }, 500);
    }
  }, [loading, hasInitiallyScrolled, tournament]);

  // Check round completion status when matches change
  useEffect(() => {
    if (tournament && isAdmin) {
      for (let round = 1; round <= tournament.total_rounds; round++) {
        checkRoundCompletionStatus(round);
      }
    }
  }, [matches, tournament, isAdmin]);

  const handleMatchUpdate = () => {
    preserveScrollPosition(() => {
      refreshMatchData();
      onUpdate();
    });
  };

  const formatScore = (result: string | null | undefined) => {
    if (!result || result === 'pending') return '?';
    
    const scoreMap: Record<string, string> = {
      'white_win': '1',
      'black_win': '0',
      'draw': '½'
    };
    
    return scoreMap[result] || result;
  };

  const toggleMatchExpansion = (matchId: number) => {
    updateExpandedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  const completeRound = async (roundNumber: number) => {
    if (!tournament || !isAdmin) return;

    try {
      setCompletingRound(roundNumber);
      await apiService.completeRound(tournament.id, roundNumber);
      
      preserveScrollPosition(() => {
        onUpdate();
        refreshMatchData();
      });
    } catch (error: any) {
      console.error('Failed to complete round:', error);
      alert(error.response?.data?.detail || 'Failed to complete round');
    } finally {
      setCompletingRound(null);
    }
  };

  const rescheduleRound = async (roundNumber: number, newDateTime: string) => {
    if (!tournament || !isAdmin) return;

    try {
      await apiService.rescheduleRound(tournament.id, roundNumber, { start_date: newDateTime });
      
      preserveScrollPosition(() => {
        refreshMatchData();
        setRoundTimes(prev => ({ ...prev, [roundNumber]: newDateTime }));
      });
    } catch (error: any) {
      console.error('Failed to reschedule round:', error);
      alert(error.response?.data?.detail || 'Failed to reschedule round');
    }
  };

  const swapTeamColors = async (matchId: number) => {
    if (!isAdmin) return;

    try {
      await apiService.swapMatchColors(matchId);
      preserveScrollPosition(() => {
        refreshMatchData();
      });
    } catch (error: any) {
      console.error('Failed to swap team colors:', error);
      alert(error.response?.data?.detail || 'Failed to swap team colors');
    }
  };

  const handleTiebreakerResolve = async (firstTeamId: number, secondTeamId: number) => {
    if (!tournament) return;

    try {
      await apiService.standingsTiebreaker(tournament.id, { 
        first_team_id: firstTeamId, 
        second_team_id: secondTeamId, 
        group: "1" 
      });
      
      // Refresh tournament data and check for new ties
      onUpdate();
      const tieCheckRes = await apiService.checkStandingsTie(tournament.id);
      setTieData(tieCheckRes);
    } catch (error: any) {
      console.error('Failed to resolve tiebreaker:', error);
      alert(error.response?.data?.detail || 'Failed to resolve tiebreaker');
    }
  };

  const getTeamName = (teamId: number): string => {
    return teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
  };

  const getPlayerName = (playerId: number): string => {
    return players.find(p => p.id === playerId)?.name || `Player ${playerId}`;
  };

  // Group matches by round
  const groupedByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_number]) {
      acc[match.round_number] = [];
    }
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, MatchResponse[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RotateCcw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <AlertCircle className="w-5 h-5 inline mr-2" />
        {error}
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center text-gray-500 p-8">
        No tournament selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tiebreaker Alert */}
      {tieData && tieData.has_ties && isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">
                Standings ties detected and need manual resolution
              </span>
            </div>
            <button
              onClick={() => {
                // Show first tie group for resolution
                const groupEntries = Object.entries(tieData.ties);
                if (groupEntries.length > 0) {
                  const [groupNumber, groupTies] = groupEntries[0];
                  const firstTeamTie = Object.entries(groupTies)[0];
                  if (firstTeamTie) {
                    const [teamId, tiedTeamIds] = firstTeamTie;
                    const tieTeams = [parseInt(teamId), ...tiedTeamIds].map(id => ({
                      id,
                      name: getTeamName(id)
                    }));
                    setCurrentTieGroup({
                      position: parseInt(teamId),
                      teams: tieTeams
                    });
                    setShowTiebreakerModal(true);
                  }
                }
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              Resolve Ties
            </button>
          </div>
        </div>
      )}

      {Object.keys(groupedByRound).length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No matches scheduled yet</p>
          {isAdmin && tournament.stage === 'not_yet_started' && (
            <p className="text-sm mt-2">Start the tournament to generate pairings</p>
          )}
        </div>
      ) : (
        Object.keys(groupedByRound)
          .map(Number)
          .sort((a, b) => a - b)
          .map((roundNumber) => {
            const roundMatches = groupedByRound[roundNumber];
            const roundType = getRoundType(roundNumber);
            const completionStatus = roundCompletionStatus[roundNumber];
            const isCurrentRound = tournament.current_round === roundNumber;
            const isCompletingThisRound = completingRound === roundNumber;

            return (
              <div
                key={roundNumber}
                id={`round-${roundNumber}`}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
                  isCurrentRound ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {roundType === 'knockout' ? (
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Calendar className="w-5 h-5 text-blue-500" />
                      )}
                      <h3 className="text-lg font-semibold">
                        {getRoundTitle(roundNumber)}
                        {isCurrentRound && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Round datetime display and scheduling */}
                      {roundTimes[roundNumber] && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {new Date(roundTimes[roundNumber]).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex items-center space-x-2">
                          {/* Round scheduling input */}
                          <input
                            type="datetime-local"
                            value={roundTimes[roundNumber] ? new Date(roundTimes[roundNumber]).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                rescheduleRound(roundNumber, new Date(e.target.value).toISOString());
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 w-36"
                          />

                          {/* Complete Round Button */}
                          {completionStatus && (
                            <button
                              onClick={() => completeRound(roundNumber)}
                              disabled={!completionStatus.can_complete || isCompletingThisRound}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center ${
                                completionStatus.can_complete
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {isCompletingThisRound ? (
                                <RotateCcw className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              {completionStatus.can_complete
                                ? 'Complete Round'
                                : `${completionStatus.unfinished_matches}/${completionStatus.total_matches} incomplete`
                              }
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {roundMatches.map((match) => {
                    const whiteTeam = teams.find(t => t.id === match.white_team_id);
                    const blackTeam = teams.find(t => t.id === match.black_team_id);
                    const isExpanded = expandedMatches[match.id];
                    const matchLabel = getMatchLabel(match);
                    const matchIcon = getMatchIcon(match);

                    return (
                      <div
                        key={match.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div
                          className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleMatchExpansion(match.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {matchIcon}
                              <div>
                                <div className="font-medium">
                                  {whiteTeam?.name || `Team ${match.white_team_id}`} vs{' '}
                                  {blackTeam?.name || `Team ${match.black_team_id}`}
                                </div>
                                {matchLabel && (
                                  <div className="text-sm text-gray-600">{matchLabel}</div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-lg font-bold">
                                {match.white_score} - {match.black_score}
                              </div>
                              
                              {match.result !== 'pending' && (
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  match.result === 'white_win' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : match.result === 'black_win'
                                    ? 'bg-red-100 text-red-800'
                                    : match.result === 'draw'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {match.result === 'white_win' 
                                    ? `${whiteTeam?.name || 'White'} wins`
                                    : match.result === 'black_win'
                                    ? `${blackTeam?.name || 'Black'} wins`
                                    : match.result === 'draw'
                                    ? 'Draw'
                                    : 'Tiebreaker'
                                  }
                                </div>
                              )}

                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="space-y-3">
                              {match.games && match.games.length > 0 ? (
                                <div className="grid gap-2">
                                  {match.games.map((game) => {
                                    const board = game.board_number;
                                    const whitePlayer = players.find(p => p.id === game.white_player_id);
                                    const blackPlayer = players.find(p => p.id === game.black_player_id);

                                    const leftIcon = board === 1 || board === 3 ? '♔' : '♚';
                                    const rightIcon = board === 1 || board === 3 ? '♚' : '♔';

                                    return (
                                      <div key={game.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <div className="flex gap-2 items-center w-1/2">
                                          <span>{leftIcon}</span>
                                          <span>{getPlayerName(game.white_player_id)}</span>
                                        </div>
                                        <InlineGameResult
                                          game={game}
                                          matchId={match.id}
                                          isAdmin={isAdmin && tournament?.stage !== 'completed' && roundNumber === tournament?.current_round}
                                          whitePlayerName={getPlayerName(game.white_player_id)}
                                          blackPlayerName={getPlayerName(game.black_player_id)}
                                          onResultUpdate={handleMatchUpdate}
                                        />
                                        <div className="flex gap-2 justify-end items-center w-1/2 text-right">
                                          <span>{getPlayerName(game.black_player_id)}</span>
                                          <span>{rightIcon}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-4">
                                  No games found for this match
                                </div>
                              )}

                              {/* Tiebreaker section for knockout matches */}
                              {roundType === 'knockout' && match.result === 'draw' && match.tiebreaker !== 'no_tiebreaker' && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-yellow-800">
                                      Tiebreaker: {match.tiebreaker === 'pending' ? 'Pending' : 
                                        match.tiebreaker === 'white_win' ? `${whiteTeam?.name} wins` :
                                        `${blackTeam?.name} wins`}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Admin controls */}
                              {isAdmin && (
                                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                                  <button
                                    onClick={() => setSelectedMatchForSwap(match)}
                                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center"
                                  >
                                    <Users className="w-3 h-3 mr-1" />
                                    Swap Players
                                  </button>

                                  {roundType === 'knockout' && (
                                    <button
                                      onClick={() => swapTeamColors(match.id)}
                                      className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center"
                                    >
                                      <Shuffle className="w-3 h-3 mr-1" />
                                      Swap Colors
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
      )}

      {/* Modals */}
      {selectedMatchForSwap && (
        <MatchSwapModal
          isOpen={true}
          onClose={() => setSelectedMatchForSwap(null)}
          match={selectedMatchForSwap}
          players={players}
          teams={teams}
          onSwapComplete={handleMatchUpdate}
        />
      )}

      {showTiebreakerModal && currentTieGroup && (
        <TiebreakerModal
          isOpen={showTiebreakerModal}
          onClose={() => setShowTiebreakerModal(false)}
          onResolve={handleTiebreakerResolve}
          teams={teams}
          tieGroup={currentTieGroup}
        />
      )}
    </div>
  );
};

export default Schedule;
