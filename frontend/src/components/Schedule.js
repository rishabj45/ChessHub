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
    const [expandedMatches, setExpandedMatches] = useState({});
    const [roundTimes, setRoundTimes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roundCompletionStatus, setRoundCompletionStatus] = useState({});
    const [completingRound, setCompletingRound] = useState(null);
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
            if (roundNumber === semiRound) {
                return `Round ${roundNumber} (Semi-finals)`;
            }
            else if (roundNumber === finalRound) {
                return `Round ${roundNumber} (Final & 3rd Place)`;
            }
            else {
                return `Round ${roundNumber} (Knockout)`;
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
        loadData();
    }, [tournament, onUpdate, isAdmin]);
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
        if (!tournament || tournament.format !== 'group_knockout' || teamId < 0) {
            return '';
        }
        const roundType = getRoundType(roundNumber);
        if (roundType !== 'group') {
            return '';
        }
        // Determine group based on team position
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex === -1)
            return '';
        const teamsPerGroup = teams.length / 2;
        const isGroupA = teamIndex < teamsPerGroup;
        return isGroupA ? ' (Group A)' : ' (Group B)';
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
        // Refresh the data after a successful swap
        onUpdate();
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
            onUpdate(); // Refresh the tournament data
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
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Schedule" }), Object.entries(groupedByRound).map(([roundStr, roundMatches]) => {
                const round = Number(roundStr);
                const roundTime = roundTimes[round];
                return (_jsxs("div", { className: "mb-6 border rounded shadow bg-gray-50", children: [_jsxs("div", { className: "flex justify-between items-center bg-gray-200 px-4 py-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: getRoundTitle(round) }), _jsx("div", { className: "flex items-center gap-4", children: isAdmin ? (_jsxs(_Fragment, { children: [_jsx("input", { type: "datetime-local", value: roundTime || '', onChange: async (e) => {
                                                    const newTime = e.target.value;
                                                    setRoundTimes((prev) => ({ ...prev, [round]: newTime }));
                                                    try {
                                                        await apiService.rescheduleRound(round, newTime);
                                                        onUpdate();
                                                    }
                                                    catch {
                                                        alert('Failed to update round schedule');
                                                    }
                                                }, className: "border rounded px-2 py-1 text-sm" }), (() => {
                                                const status = roundCompletionStatus[round];
                                                const isCurrentRound = tournament?.current_round === round;
                                                const isCompleted = round < (tournament?.current_round || 0);
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
                            return (_jsxs("div", { className: "bg-white p-4 border-b", children: [_jsxs("div", { className: "flex justify-between items-center mb-2 cursor-pointer", onClick: () => setExpandedMatches((prev) => ({
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
                    onUpdate();
                } })), selectedMatchForSwap && (_jsx(MatchSwapModal, { match: selectedMatchForSwap, isOpen: !!selectedMatchForSwap, onClose: () => setSelectedMatchForSwap(null), onSwapComplete: handleSwapComplete, players: players, teams: teams }))] }));
};
export default Schedule;
