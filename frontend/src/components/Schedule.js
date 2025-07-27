import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import MatchResult from './MatchResult';
import MatchSwapModal from './MatchSwapModal';
const Schedule = ({ isAdmin, tournament, onUpdate }) => {
    const [matches, setMatches] = useState([]);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedMatchForSwap, setSelectedMatchForSwap] = useState(null);
    // Initialize expandedMatches from localStorage
    const [expandedMatches, setExpandedMatches] = useState(() => {
        try {
            const saved = localStorage.getItem('chesshub-expanded-matches');
            return saved ? JSON.parse(saved) : {};
        }
        catch {
            return {};
        }
    });
    const [roundTimes, setRoundTimes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roundCompletionStatus, setRoundCompletionStatus] = useState({});
    const [completingRound, setCompletingRound] = useState(null);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    // Professional scroll restoration approach with multiple fallback strategies
    const preserveScrollPosition = (callback) => {
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
                        element.scrollIntoView({ behavior: 'auto', block: 'start' });
                        // Fine-tune position
                        setTimeout(() => {
                            window.scrollTo(scrollX, Math.max(0, scrollY));
                        }, 10);
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
        if (!tournament)
            return;
        try {
            const allMatches = [];
            for (let round = 1; round <= tournament.total_rounds; round++) {
                const res = await apiService.getMatches(tournament.id, round);
                allMatches.push(...res);
            }
            setMatches(allMatches);
        }
        catch (err) {
            console.error('Failed to refresh match data:', err);
        }
    };
    // Function to update expandedMatches with persistence
    const updateExpandedMatches = (updater) => {
        setExpandedMatches((prev) => {
            const newState = updater(prev);
            try {
                localStorage.setItem('chesshub-expanded-matches', JSON.stringify(newState));
            }
            catch (error) {
                console.warn('Failed to save expanded matches to localStorage:', error);
            }
            return newState;
        });
    };
    const getRoundType = (roundNumber) => {
        if (!tournament || tournament.format !== 'group_knockout') {
            return 'group'; // Default for round-robin
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
    const getRoundTitle = (roundNumber) => {
        const roundType = getRoundType(roundNumber);
        if (roundType === 'group') {
            return `Round ${roundNumber} (Group Stage)`;
        }
        else {
            // Knockout rounds
            const totalRounds = tournament?.total_rounds || 0;
            const semiRound = totalRounds - 1;
            const finalRound = totalRounds;
            // For group+knockout format, hide round numbers when in semifinal or final stages
            const isGroupKnockoutFormat = tournament?.format === 'group_knockout';
            const isKnockoutStage = tournament?.stage === 'semifinal' ||
                tournament?.stage === 'semi_final' ||
                tournament?.stage === 'final';
            const hideRoundNumber = isGroupKnockoutFormat && isKnockoutStage && roundType === 'knockout';
            // Determine title based on the specific round number, not just tournament stage
            if (roundNumber === semiRound) {
                return hideRoundNumber ? 'Semifinals' : `Round ${roundNumber} (Semi-finals)`;
            }
            else if (roundNumber === finalRound) {
                return hideRoundNumber ? 'Final & 3rd Place' : `Round ${roundNumber} (Final & 3rd Place)`;
            }
            else {
                return hideRoundNumber ? 'Knockout' : `Round ${roundNumber} (Knockout)`;
            }
        }
    };
    useEffect(() => {
        const loadData = async () => {
            if (!tournament)
                return;
            try {
                setLoading(true);
                const allMatches = [];
                for (let round = 1; round <= tournament.total_rounds; round++) {
                    const res = await apiService.getMatches(tournament.id, round);
                    allMatches.push(...res);
                }
                const [allPlayers, allTeams] = await Promise.all([
                    apiService.getPlayers(),
                    apiService.getTeams(),
                ]);
                setMatches(allMatches);
                setPlayers(allPlayers);
                setTeams(allTeams);
                const roundTimeMap = {};
                allMatches.forEach((m) => {
                    if (m.scheduled_date && !roundTimeMap[m.round_number]) {
                        roundTimeMap[m.round_number] = new Date(m.scheduled_date).toISOString().slice(0, 16);
                    }
                });
                setRoundTimes(roundTimeMap);
                // Load round completion status for admin users
                if (isAdmin) {
                    for (let round = 1; round <= tournament.total_rounds; round++) {
                        await checkRoundCompletionStatus(round);
                    }
                }
                setError(null);
            }
            catch (err) {
                console.error('Failed to load schedule:', err);
                setError('Failed to load schedule');
            }
            finally {
                setLoading(false);
            }
        };
        // Reset scroll flag when tournament changes (new tournament or refresh)
        setHasInitiallyScrolled(false);
        loadData();
    }, [tournament?.id, isAdmin]); // Changed dependency to tournament.id instead of tournament object
    // Auto-scroll to current round ONLY on initial load and refresh
    useEffect(() => {
        if (!loading && tournament && matches.length > 0 && !hasInitiallyScrolled) {
            const currentRound = tournament.current_round;
            if (currentRound > 0) {
                // Clear all expanded matches first, then auto-expand current round matches
                updateExpandedMatches(() => {
                    const newExpanded = {};
                    const currentRoundMatches = matches.filter(m => m.round_number === currentRound);
                    currentRoundMatches.forEach(match => {
                        newExpanded[match.id] = true;
                    });
                    return newExpanded;
                });
                // Small delay to ensure DOM is fully rendered
                setTimeout(() => {
                    const currentRoundElement = document.getElementById(`round-${currentRound}`);
                    if (currentRoundElement) {
                        currentRoundElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                    setHasInitiallyScrolled(true);
                }, 300);
            }
            else {
                // No current round, just clear expanded matches
                updateExpandedMatches(() => ({}));
                setHasInitiallyScrolled(true);
            }
        }
    }, [loading, tournament?.current_round, matches.length, hasInitiallyScrolled, updateExpandedMatches]);
    // Reset scroll flag on unmount
    useEffect(() => {
        return () => {
            setHasInitiallyScrolled(false);
        };
    }, []);
    const getPlayer = (id) => players.find((p) => p.id === id);
    const getTeamName = (id) => {
        // Handle placeholder teams for knockout stage
        if (id < 0) {
            const placeholderMap = {
                [-1]: "A1", [-2]: "A2", [-3]: "B1", [-4]: "B2",
                [-5]: "Winner SF1", [-6]: "Winner SF2",
                [-7]: "Loser SF1", [-8]: "Loser SF2"
            };
            return placeholderMap[id] || `Placeholder ${id}`;
        }
        return teams.find((t) => t.id === id)?.name || `Team ${id}`;
    };
    const getGroupLabel = (teamId, roundNumber) => {
        // Remove group A/B labels in brackets for group+knockout format matches
        return '';
    };
    const groupedByRound = matches.reduce((acc, match) => {
        acc[match.round_number] = acc[match.round_number] || [];
        acc[match.round_number].push(match);
        return acc;
    }, {});
    const formatScore = (result) => {
        if (!result || result === 'pending')
            return '–';
        const score = result === 'white_win' ? [1, 0] :
            result === 'black_win' ? [0, 1] :
                result === 'draw' ? [0.5, 0.5] : [0, 0];
        return `${score[0]}–${score[1]}`;
    };
    const handleSwapComplete = () => {
        // Use professional scroll preservation for swap completion
        preserveScrollPosition(() => {
            refreshMatchData();
        });
    };
    const checkRoundCompletionStatus = async (roundNumber) => {
        if (!tournament)
            return;
        try {
            const status = await apiService.canCompleteRound(tournament.id, roundNumber);
            setRoundCompletionStatus(prev => ({ ...prev, [roundNumber]: status }));
        }
        catch (error) {
            console.error(`Failed to check completion status for round ${roundNumber}:`, error);
        }
    };
    const handleCompleteRound = async (roundNumber) => {
        if (!tournament)
            return;
        setCompletingRound(roundNumber);
        try {
            const result = await apiService.completeRound(tournament.id, roundNumber);
            alert(`✅ Round ${roundNumber} completed successfully!\n\n${result.round_info.message || ''}`);
            // Use professional scroll preservation for round completion
            preserveScrollPosition(() => {
                onUpdate();
            });
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to complete round';
            if (errorMessage.includes('All matches must be completed')) {
                alert(`❌ Cannot complete round ${roundNumber}:\n\n${errorMessage}\n\nPlease ensure all matches have results before completing the round.`);
            }
            else {
                alert(`❌ Error: ${errorMessage}`);
            }
        }
        finally {
            setCompletingRound(null);
        }
    };
    if (loading)
        return _jsx("div", { children: "Loading schedule..." });
    if (error)
        return _jsx("div", { className: "text-red-500", children: error });
    return (_jsxs("div", { style: { scrollBehavior: 'auto' }, children: [_jsx("h2", { className: "text-2xl mb-4", children: "Schedule" }), Object.entries(groupedByRound).map(([roundStr, roundMatches]) => {
                const round = Number(roundStr);
                const roundTime = roundTimes[round];
                const isCurrentRound = tournament?.current_round === round;
                const isPastRound = tournament && round < tournament.current_round;
                const isFutureRound = tournament && round > tournament.current_round;
                let roundClass = "mb-6 border rounded shadow ";
                if (isCurrentRound) {
                    roundClass += "border-2 border-blue-500 bg-blue-50 shadow-lg";
                }
                else if (isPastRound) {
                    roundClass += "bg-gray-100 border-gray-300";
                }
                else {
                    roundClass += "bg-gray-50 border-gray-200";
                }
                return (_jsxs("div", { className: roundClass, style: { scrollMarginTop: '20px' }, children: [_jsxs("div", { className: `flex justify-between items-center px-4 py-2 ${isCurrentRound ? 'bg-blue-200' :
                                isPastRound ? 'bg-gray-300' : 'bg-gray-200'}`, id: `round-${round}`, children: [_jsxs("h3", { className: `text-lg font-semibold ${isCurrentRound ? 'text-blue-800' :
                                        isPastRound ? 'text-gray-600' : 'text-gray-800'}`, children: [getRoundTitle(round), isCurrentRound && _jsx("span", { className: "ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded", children: "Current" }), isPastRound && _jsx("span", { className: "ml-2 text-xs text-gray-500", children: "(Completed)" })] }), _jsx("div", { className: "flex items-center gap-4", children: isAdmin ? (_jsxs(_Fragment, { children: [_jsx("input", { type: "datetime-local", value: roundTime || '', onChange: async (e) => {
                                                    const newTime = e.target.value;
                                                    setRoundTimes((prev) => ({ ...prev, [round]: newTime }));
                                                    try {
                                                        await apiService.rescheduleRound(round, newTime);
                                                        // Use professional scroll preservation for rescheduling
                                                        preserveScrollPosition(() => {
                                                            onUpdate();
                                                        });
                                                    }
                                                    catch {
                                                        alert('Failed to update round schedule');
                                                    }
                                                }, className: "border rounded px-2 py-1 text-sm" }), (() => {
                                                const status = roundCompletionStatus[round];
                                                const isCurrentRound = tournament?.current_round === round;
                                                const isCompleted = round < (tournament?.current_round || 0) ||
                                                    (status && status.reason === "Round is already completed");
                                                if (isCompleted) {
                                                    return (_jsx("span", { className: "text-sm px-3 py-1 bg-green-500 text-white rounded", children: "\u2705 Completed" }));
                                                }
                                                if (!isCurrentRound) {
                                                    return null; // Don't show button for future rounds
                                                }
                                                if (status?.can_complete) {
                                                    return (_jsx("button", { onClick: () => handleCompleteRound(round), disabled: completingRound === round, className: "text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50", title: status.message || `Complete round ${round} - All ${status.total_matches} matches finished`, children: completingRound === round ? 'Completing...' : 'Complete Round' }));
                                                }
                                                else if (status) {
                                                    const missingCount = status.missing_matches || 0;
                                                    const tooltipText = status.reason || `${missingCount} matches still need results`;
                                                    return (_jsxs("span", { className: "text-sm px-3 py-1 bg-gray-400 text-white rounded cursor-help", title: tooltipText, children: [status.completed_matches || 0, "/", status.total_matches || 0, " Finished"] }));
                                                }
                                                return null;
                                            })()] })) : (_jsx("span", { className: "text-sm text-gray-700", children: roundTime ? new Date(roundTime).toLocaleString() : 'TBD' })) })] }), roundMatches.map((match) => {
                            const expanded = expandedMatches[match.id] ?? false;
                            return (_jsxs("div", { className: "bg-white p-4 border-b", children: [_jsxs("div", { className: "flex justify-between items-center mb-2 cursor-pointer", onClick: () => updateExpandedMatches((prev) => ({
                                            ...prev,
                                            [match.id]: !prev[match.id],
                                        })), children: [_jsxs("p", { className: "text-lg font-semibold", children: [getTeamName(match.white_team_id), getGroupLabel(match.white_team_id, round), " vs ", getTeamName(match.black_team_id), getGroupLabel(match.black_team_id, round), " (", match.white_score ?? 0, "\u2013", match.black_score ?? 0, ")"] }), _jsx("span", { className: "text-sm text-blue-600", children: expanded ? 'Hide Boards ▲' : 'Show Boards ▼' })] }), expanded && (_jsxs("div", { className: "text-sm grid gap-2", children: [match.games.map((game) => {
                                                const board = game.board_number;
                                                const whitePlayer = getPlayer(game.white_player_id);
                                                const blackPlayer = getPlayer(game.black_player_id);
                                                const leftIcon = board === 1 || board === 3 ? '♔' : '♚';
                                                const rightIcon = board === 1 || board === 3 ? '♚' : '♔';
                                                return (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 p-2 rounded", children: [_jsxs("div", { className: "flex gap-2 items-center w-1/2", children: [_jsx("span", { children: leftIcon }), _jsx("span", { children: whitePlayer?.name || 'Unknown' })] }), _jsx("div", { className: "text-center text-gray-700 w-20", children: formatScore(game.result) }), _jsxs("div", { className: "flex gap-2 justify-end items-center w-1/2 text-right", children: [_jsx("span", { children: blackPlayer?.name || 'Unknown' }), _jsx("span", { children: rightIcon })] })] }, game.id));
                                            }), isAdmin && tournament?.stage !== 'completed' && round === tournament?.current_round && (_jsxs("div", { className: "flex justify-end mt-2 gap-2", children: [_jsx("button", { className: "text-sm px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600", onClick: (e) => {
                                                            e.stopPropagation();
                                                            setSelectedMatchForSwap(match);
                                                        }, title: "Swap players in this match", children: "Swap Players" }), _jsx("button", { className: "text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: (e) => {
                                                            e.stopPropagation();
                                                            setSelectedMatch(match);
                                                        }, children: "Enter Results" })] })), isAdmin && (tournament?.stage === 'completed' || round < (tournament?.current_round || 0)) && (_jsx("div", { className: "flex justify-end mt-2", children: _jsx("div", { className: "text-sm px-3 py-1 bg-gray-400 text-white rounded", children: tournament?.stage === 'completed' ? 'Tournament Completed - Editing Disabled' : 'Round Completed - Editing Disabled' }) }))] }))] }, match.id));
                        })] }, round));
            }), selectedMatch && (_jsx(MatchResult, { match: selectedMatch, players: players, onClose: () => {
                    setSelectedMatch(null);
                    // Use professional scroll preservation technique
                    preserveScrollPosition(() => {
                        refreshMatchData();
                    });
                } })), selectedMatchForSwap && (_jsx(MatchSwapModal, { match: selectedMatchForSwap, isOpen: !!selectedMatchForSwap, onClose: () => setSelectedMatchForSwap(null), onSwapComplete: handleSwapComplete, players: players, teams: teams }))] }));
};
export default Schedule;
