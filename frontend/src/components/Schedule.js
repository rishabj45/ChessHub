import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import MatchResult from './MatchResult';
import PlayerSwapModal from './PlayerSwapModal';
const Schedule = ({ isAdmin, tournament, onUpdate }) => {
    const [matches, setMatches] = useState([]);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedGameForSwap, setSelectedGameForSwap] = useState(null);
    const [expandedMatches, setExpandedMatches] = useState({});
    const [roundTimes, setRoundTimes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const loadData = async () => {
            if (!tournament)
                return;
            try {
                setLoading(true);
                const allMatches = [];
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
                const roundTimeMap = {};
                allMatches.forEach((m) => {
                    if (m.scheduled_date && !roundTimeMap[m.round_number]) {
                        roundTimeMap[m.round_number] = new Date(m.scheduled_date).toISOString().slice(0, 16);
                    }
                });
                setRoundTimes(roundTimeMap);
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
    }, [tournament, onUpdate]);
    const getPlayer = (id) => players.find((p) => p.id === id);
    const getTeamName = (id) => teams.find((t) => t.id === id)?.name || `Team ${id}`;
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
    if (loading)
        return _jsx("div", { children: "Loading schedule..." });
    if (error)
        return _jsx("div", { className: "text-red-500", children: error });
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Schedule" }), Object.entries(groupedByRound).map(([roundStr, roundMatches]) => {
                const round = Number(roundStr);
                const roundTime = roundTimes[round];
                return (_jsxs("div", { className: "mb-6 border rounded shadow bg-gray-50", children: [_jsxs("div", { className: "flex justify-between items-center bg-gray-200 px-4 py-2", children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["Round ", round] }), _jsx("div", { className: "flex items-center gap-4", children: isAdmin ? (_jsx("input", { type: "datetime-local", value: roundTime || '', onChange: async (e) => {
                                            const newTime = e.target.value;
                                            setRoundTimes((prev) => ({ ...prev, [round]: newTime }));
                                            try {
                                                await apiService.rescheduleRound(round, newTime);
                                                onUpdate();
                                            }
                                            catch {
                                                alert('Failed to update round schedule');
                                            }
                                        }, className: "border rounded px-2 py-1 text-sm" })) : (_jsx("span", { className: "text-sm text-gray-700", children: roundTime ? new Date(roundTime).toLocaleString() : 'TBD' })) })] }), roundMatches.map((match) => {
                            const expanded = expandedMatches[match.id] ?? false;
                            return (_jsxs("div", { className: "bg-white p-4 border-b", children: [_jsxs("div", { className: "flex justify-between items-center mb-2 cursor-pointer", onClick: () => setExpandedMatches((prev) => ({
                                            ...prev,
                                            [match.id]: !prev[match.id],
                                        })), children: [_jsxs("p", { className: "text-lg font-semibold", children: [getTeamName(match.white_team_id), " vs ", getTeamName(match.black_team_id), " (", match.white_score ?? 0, "\u2013", match.black_score ?? 0, ")"] }), _jsx("span", { className: "text-sm text-blue-600", children: expanded ? 'Hide Boards ▲' : 'Show Boards ▼' })] }), expanded && (_jsxs("div", { className: "text-sm grid gap-2", children: [match.games.map((game) => {
                                                const board = game.board_number;
                                                const whitePlayer = getPlayer(game.white_player_id);
                                                const blackPlayer = getPlayer(game.black_player_id);
                                                const leftIcon = board === 1 || board === 3 ? '♔' : '♚';
                                                const rightIcon = board === 1 || board === 3 ? '♚' : '♔';
                                                return (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 p-2 rounded", children: [_jsxs("div", { className: "flex gap-2 items-center w-1/2", children: [_jsx("span", { children: leftIcon }), _jsx("span", { children: whitePlayer?.name || 'Unknown' })] }), _jsx("div", { className: "text-center text-gray-700 w-20", children: formatScore(game.result) }), _jsxs("div", { className: "flex gap-2 justify-end items-center w-1/2 text-right", children: [_jsx("span", { children: blackPlayer?.name || 'Unknown' }), _jsx("span", { children: rightIcon })] }), isAdmin && !match.is_completed && (_jsx("div", { className: "flex gap-1 ml-2", children: _jsx("button", { className: "text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGameForSwap({ match, game });
                                                                }, title: "Swap players for this board", children: "Swap" }) }))] }, game.id));
                                            }), isAdmin && (_jsx("div", { className: "flex justify-end mt-2 gap-2", children: _jsx("button", { className: "text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: (e) => {
                                                        e.stopPropagation();
                                                        setSelectedMatch(match);
                                                    }, children: "Enter Results" }) }))] }))] }, match.id));
                        })] }, round));
            }), selectedMatch && (_jsx(MatchResult, { match: selectedMatch, players: players, onClose: () => {
                    setSelectedMatch(null);
                    onUpdate();
                } })), selectedGameForSwap && (_jsx(PlayerSwapModal, { match: selectedGameForSwap.match, game: selectedGameForSwap.game, isOpen: !!selectedGameForSwap, onClose: () => setSelectedGameForSwap(null), onSwapComplete: handleSwapComplete, players: players, teams: teams }))] }));
};
export default Schedule;
