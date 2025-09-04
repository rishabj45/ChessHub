import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, AlertCircle, Users, RotateCcw, Crown, Trophy, Medal, 
  ChevronDown, ChevronUp, Shuffle, Info, Filter, Search, 
  RefreshCw, Zap, Timer, Award, Star
} from 'lucide-react';
import { apiService } from '../services/api';
import { MatchResponse, Player, Team, Tournament } from '../types';
import MatchSwapModal from './MatchSwapModal';
import InlineGameResult from './InlineGameResult';

interface ScheduleProps {
  isAdmin: boolean;
  tournament: Tournament | null;
  onUpdate: () => void;
}

interface RoundCompletionStatus {
  can_complete: boolean;
  unfinished_matches: number;
  total_matches: number;
}

interface FilterState {
  searchTerm: string;
}

const Schedule: React.FC<ScheduleProps> = ({ isAdmin, tournament, onUpdate }) => {
  // Add smooth scrolling to the document and prevent auto-scroll to top

  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchForSwap, setSelectedMatchForSwap] = useState<MatchResponse | null>(null);
  
  // Enhanced state management
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: ''
  });
  
  // Initialize expandedMatches from localStorage with tournament-specific key
  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`chesshub-expanded-matches-${tournament?.id || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [hasScrolledToCurrentRound, setHasScrolledToCurrentRound] = useState(false);
  
  const [roundTimes, setRoundTimes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundCompletionStatus, setRoundCompletionStatus] = useState<Record<number, RoundCompletionStatus>>({});
  const [completingRound, setCompletingRound] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Function to scroll to current round and expand its matches
  const scrollToCurrentRound = () => {
    if (!tournament || tournament.current_round <= 0) return;
    
    const currentRound = tournament.current_round;
    const roundElement = document.getElementById(`round-${currentRound}`);
    
    if (roundElement) {
      // First expand all matches in the current round
      const currentRoundMatches = matches.filter(m => m.round_number === currentRound);
      if (currentRoundMatches.length > 0) {
        updateExpandedMatches(prev => {
          const newState = { ...prev };
          currentRoundMatches.forEach(match => {
            newState[match.id] = true;
          });
          return newState;
        });
      }
      
      // Then scroll to the round with smooth behavior
      setTimeout(() => {
        const headerOffset = 80;
        const elementTop = roundElement.offsetTop;
        const targetPosition = Math.max(0, elementTop - headerOffset);
        
        window.scrollTo({ 
          top: targetPosition, 
          behavior: 'smooth' 
        });
        
        setHasScrolledToCurrentRound(true);
      }, 100);
    }
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

      // Auto-scroll to current round if flag is not set
      if (!hasScrolledToCurrentRound) {
        setTimeout(() => {
          scrollToCurrentRound();
        }, 100);
      }
    } catch (err) {
      console.error('Failed to refresh match data:', err);
    }
  };

  // Function to update expandedMatches with better persistence
  const updateExpandedMatches = (updater: (prev: Record<number, boolean>) => Record<number, boolean>) => {
    setExpandedMatches((prev) => {
      const newState = updater(prev);
      try {
        localStorage.setItem(`chesshub-expanded-matches-${tournament?.id || 'default'}`, JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to save expanded matches to localStorage:', error);
      }
      return newState;
    });
  };

  // Helper functions for filtering
  const getTeamName = (teamId: number): string => {
    return teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
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

  // Enhanced filtering and sorting
  const filteredAndSortedMatches = useMemo(() => {
    let filtered = matches;

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(match => {
        const whiteTeam = getTeamName(match.white_team_id).toLowerCase();
        const blackTeam = getTeamName(match.black_team_id).toLowerCase();
        const matchLabel = getMatchLabel(match).toLowerCase();
        return whiteTeam.includes(searchLower) || 
               blackTeam.includes(searchLower) || 
               matchLabel.includes(searchLower);
      });
    }

    // Default sorting by round number
    filtered.sort((a, b) => a.round_number - b.round_number);

    return filtered;
  }, [matches, filters, teams]);

  const groupedByRound = useMemo(() => {
    return filteredAndSortedMatches.reduce((acc, match) => {
      if (!acc[match.round_number]) {
        acc[match.round_number] = [];
      }
      acc[match.round_number].push(match);
      return acc;
    }, {} as Record<number, MatchResponse[]>);
  }, [filteredAndSortedMatches]);

  // Tournament stage helpers
  const getRoundType = (roundNumber: number): 'group' | 'knockout' => {
    if (!tournament || tournament.format !== 'group_knockout') {
      return 'group'; // Default for round-robin and swiss
    }

    // Calculate group stage rounds
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
      return `Round ${roundNumber} `;
    } else {
      // Knockout rounds
      const totalRounds = tournament?.total_rounds || 0;
      if (roundNumber === totalRounds - 1) {
        return `Semi Finals`;
      } else if (roundNumber === totalRounds) {
        return `Finals`;
      } 
    }
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
      setHasScrolledToCurrentRound(false); // Reset scroll flag

      const [playersRes, teamsRes] = await Promise.all([
        apiService.getPlayers(undefined, tournament.id),
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

  // Auto-scroll to current round when data is loaded
  useEffect(() => {
    if (!loading && matches.length > 0 && !hasScrolledToCurrentRound && tournament) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        scrollToCurrentRound();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, matches, hasScrolledToCurrentRound, tournament]);

  // Reset scroll flag when tournament changes
  useEffect(() => {
    setHasScrolledToCurrentRound(false);
  }, [tournament?.id]);

  // Check round completion status when matches change
  useEffect(() => {
    if (tournament && isAdmin) {
      for (let round = 1; round <= tournament.total_rounds; round++) {
        checkRoundCompletionStatus(round);
      }
    }
  }, [matches, tournament, isAdmin]);

  const handleMatchUpdate = async () => {
    const scrollY = window.scrollY;
    await refreshMatchData();
    onUpdate?.();
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
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
      const scrollY = window.scrollY;
      await apiService.completeRound(tournament.id, roundNumber);
      
      await refreshMatchData();
      onUpdate();
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
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
      const scrollY = window.scrollY;
      await apiService.rescheduleRound(tournament.id, roundNumber, { start_date: newDateTime });
      
      await refreshMatchData();
      setRoundTimes(prev => ({ ...prev, [roundNumber]: newDateTime }));
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    } catch (error: any) {
      console.error('Failed to reschedule round:', error);
      alert(error.response?.data?.detail || 'Failed to reschedule round');
    }
  };

  const swapTeamColors = async (matchId: number) => {
    if (!isAdmin) return;

    try {
      const scrollY = window.scrollY;
      await apiService.swapMatchColors(matchId);
      await refreshMatchData();
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    } catch (error: any) {
      console.error('Failed to swap team colors:', error);
      alert(error.response?.data?.detail || 'Failed to swap team colors');
    }
  };

  const getPlayerName = (playerId: number): string => {
    return players.find(p => p.id === playerId)?.name || `Player ${playerId}`;
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RotateCcw className="w-6 h-6 animate-spin mr-2 text-blue-500" />
        <span className="text-gray-700">Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <AlertCircle className="w-5 h-5 inline mr-2" />
        {error}
        <button 
          onClick={loadSchedule}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center text-gray-500 p-8">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No tournament selected</p>
        <p className="text-sm">Please select a tournament to view its schedule</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left side - Title and Stats */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Schedule
            </h2>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-2">
            {/* Manual Refresh */}
            <button
              onClick={() => {
                setHasScrolledToCurrentRound(false);
                refreshMatchData();
              }}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 mr-1" />
            </button>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Team name"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedMatches.length} of {matches.length} matches
              </div>
              {filters.searchTerm && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Content */}
      {Object.keys(groupedByRound).length === 0 ? (
        <div className="text-center text-gray-500 p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No matches found</h3>
          {filters.searchTerm ? (
            <p className="text-sm">Try adjusting your search to see more matches</p>
          ) : (
            <>
              <p className="text-sm mb-4">No matches scheduled yet</p>
              {isAdmin && tournament.stage === 'not_yet_started' && (
                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg inline-block">
                  <Info className="w-4 h-4 inline mr-1" />
                  Start the tournament to generate pairings
                </p>
              )}
            </>
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
                className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                  isCurrentRound 
                    ? 'border-blue-300 shadow-lg ring-2 ring-blue-100' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Enhanced Round Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        {roundType === 'knockout' ? (
                          <Trophy className="w-6 h-6 text-yellow-500" />
                        ) : (
                          <Calendar className="w-6 h-6 text-blue-500" />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {getRoundTitle(roundNumber)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {isCurrentRound && (
                              <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                <Star className="w-3 h-3 mr-1" />
                                Current Round
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Round datetime display and scheduling */}
                      {roundTimes[roundNumber] && !isAdmin && (
                        <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                          <Timer className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">
                            {new Date(roundTimes[roundNumber]).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex items-center space-x-2">
                          {/* Round scheduling input */}
                          <div className="flex items-center space-x-2">
                            <Timer className="w-4 h-4 text-blue-500" />
                            <input
                              type="datetime-local"
                              value={roundTimes[roundNumber] ? new Date(roundTimes[roundNumber]).toISOString().slice(0, 16) : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  rescheduleRound(roundNumber, new Date(e.target.value).toISOString());
                                }
                              }}
                              className="text-sm border border-gray-300 rounded px-3 py-2 w-44 focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>

                          {/* Complete Round Button */}
                          {completionStatus && isCurrentRound && completionStatus.can_complete && (
                            <button
                              onClick={() => completeRound(roundNumber)}
                              disabled={isCompletingThisRound}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                            >
                              {isCompletingThisRound ? (
                                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Zap className="w-4 h-4 mr-2" />
                              )}
                              Complete Round
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Round Content */}
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
                          className={`border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                            match.is_completed 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div
                            className={`p-4 cursor-pointer transition-colors duration-200 ${
                              match.is_completed 
                                ? 'bg-green-50 hover:bg-green-100' 
                                : 'bg-gray-50 hover:bg-blue-50'
                            }`}
                            onClick={() => toggleMatchExpansion(match.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {matchIcon}
                                <div>
                                  <div className="font-semibold text-lg">
                                    {whiteTeam?.name || `Team ${match.white_team_id}`} 
                                    <span className="mx-2 text-gray-400">vs</span>
                                    {blackTeam?.name || `Team ${match.black_team_id}`}
                                  </div>
                                  {matchLabel && (
                                    <div className="text-sm text-blue-600 font-medium flex items-center">
                                      <Award className="w-4 h-4 mr-1" />
                                      {matchLabel}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-6">
                                {/* Enhanced Score Display */}
                                <div className="text-2xl font-bold bg-white px-4 py-2 rounded-lg shadow-sm border">
                                  <span className={match.white_score > match.black_score ? 'text-green-600' : 'text-gray-700'}>
                                    {match.white_score}
                                  </span>
                                  <span className="mx-2 text-gray-400">-</span>
                                  <span className={match.black_score > match.white_score ? 'text-green-600' : 'text-gray-700'}>
                                    {match.black_score}
                                  </span>
                                </div>
                                
                                {/* Enhanced Result Badge */}
                                {match.result !== 'pending' && (
                                  <div className={`px-3 py-2 rounded-full text-sm font-medium flex items-center ${
                                    match.result === 'white_win' 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : match.result === 'black_win'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : match.result === 'draw'
                                      ? 'bg-gray-100 text-gray-800 border border-gray-200'
                                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  }`}>
                                    {match.result === 'white_win' && <Trophy className="w-4 h-4 mr-1" />}
                                    {match.result === 'black_win' && <Trophy className="w-4 h-4 mr-1" />}
                                    {match.result === 'draw' && <Medal className="w-4 h-4 mr-1" />}
                                    {match.result === 'tiebreaker' && <Zap className="w-4 h-4 mr-1" />}
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

                                {/* Expand/Collapse Icon */}
                                {isExpanded ? (
                                  <ChevronUp className="w-6 h-6 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Match Details */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-white">
                              <div className="p-6 space-y-4">
                                {match.games && match.games.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="grid gap-3">
                                      {match.games.map((game) => {
                                        const board = game.board_number;
                                        const whitePlayer = players.find(p => p.id === game.white_player_id);
                                        const blackPlayer = players.find(p => p.id === game.black_player_id);

                                        const leftIcon = board === 1 || board === 3 ? '♔' : '♚';
                                        const rightIcon = board === 1 || board === 3 ? '♚' : '♔';

                                        return (
                                          <div key={game.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                                            <div className="flex gap-3 items-center w-1/3">
                                              <span className="text-2xl">{leftIcon}</span>
                                              <div>
                                                <div className="font-medium">{getPlayerName(game.white_player_id)}</div>
                                              </div>
                                            </div>
                                            <div className="w-1/3 flex justify-center">
                                              <InlineGameResult
                                                game={game}
                                                matchId={match.id}
                                                isAdmin={isAdmin && tournament?.stage !== 'completed' && roundNumber === tournament?.current_round}
                                                whitePlayerName={getPlayerName(game.white_player_id)}
                                                blackPlayerName={getPlayerName(game.black_player_id)}
                                                onResultUpdate={handleMatchUpdate}
                                              />
                                            </div>
                                            <div className="flex gap-3 justify-end items-center w-1/3 text-right">
                                              <div>
                                                <div className="font-medium">{getPlayerName(game.black_player_id)}</div>
                                              </div>
                                              <span className="text-2xl">{rightIcon}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="font-medium">No games found for this match</p>
                                    <p className="text-sm">Games may not have been generated yet</p>
                                  </div>
                                )}

                                {/* Enhanced Tiebreaker section for knockout matches */}
                                {roundType === 'knockout' && match.result === 'draw' && match.tiebreaker !== 'no_tiebreaker' && (
                                  <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                                        <span className="font-semibold text-yellow-800">
                                          Tiebreaker Status
                                        </span>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        match.tiebreaker === 'pending' 
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {match.tiebreaker === 'pending' ? 'Pending Resolution' : 
                                          match.tiebreaker === 'white_win' ? `${whiteTeam?.name} wins` :
                                          `${blackTeam?.name} wins`}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Enhanced Admin controls */}
                                {isAdmin && isCurrentRound && (
                                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                    <button
                                      onClick={() => setSelectedMatchForSwap(match)}
                                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center transition-colors shadow-sm hover:shadow-md"
                                    >
                                      <Users className="w-4 h-4 mr-2" />
                                      Swap Players
                                    </button>

                                    {roundType === 'knockout' && (
                                      <button
                                        onClick={() => swapTeamColors(match.id)}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center transition-colors shadow-sm hover:shadow-md"
                                      >
                                        <Shuffle className="w-4 h-4 mr-2" />
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

      {/* Enhanced Modals */}
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
    </div>
  );
};

export default React.memo(Schedule);
