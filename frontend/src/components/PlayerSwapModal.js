import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// frontend/src/components/PlayerSwapModal.tsx  
import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';
const PlayerSwapModal = ({ match, game, isOpen, onClose, onSwapComplete, players, teams }) => {
    const [availableSwaps, setAvailableSwaps] = useState(null);
    const [selectedWhitePlayer, setSelectedWhitePlayer] = useState(game.white_player_id);
    const [selectedBlackPlayer, setSelectedBlackPlayer] = useState(game.black_player_id);
    const [swapReason, setSwapReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (isOpen) {
            loadAvailableSwaps();
            setSelectedWhitePlayer(game.white_player_id);
            setSelectedBlackPlayer(game.black_player_id);
            setSwapReason('');
            setError(null);
        }
    }, [isOpen, game.id]);
    const loadAvailableSwaps = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAvailableSwaps(match.id);
            setAvailableSwaps(response);
        }
        catch (err) {
            console.error('Failed to load available swaps:', err);
            setError('Failed to load available players for swapping');
        }
        finally {
            setLoading(false);
        }
    };
    const executeSwap = async () => {
        if (!availableSwaps)
            return;
        // Check if any changes were made
        const whiteChanged = selectedWhitePlayer !== game.white_player_id;
        const blackChanged = selectedBlackPlayer !== game.black_player_id;
        if (!whiteChanged && !blackChanged) {
            setError('No changes made to player assignments');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await apiService.swapGamePlayers(match.id, game.id, {
                new_white_player_id: whiteChanged ? selectedWhitePlayer : undefined,
                new_black_player_id: blackChanged ? selectedBlackPlayer : undefined,
                reason: swapReason.trim() || undefined
            });
            onSwapComplete();
            onClose();
        }
        catch (err) {
            console.error('Failed to swap players:', err);
            setError(err.response?.data?.detail || 'Failed to swap players');
        }
        finally {
            setLoading(false);
        }
    };
    const getPlayerName = (playerId) => {
        return players.find(p => p.id === playerId)?.name || `Player ${playerId}`;
    };
    const getTeamName = (teamId) => {
        return teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
    };
    const getPlayerConflicts = (playerId, isWhite) => {
        if (!availableSwaps)
            return null;
        // Check if player is already assigned to another board in this match
        const otherBoards = match.games.filter(g => g.id !== game.id);
        const conflict = otherBoards.find(g => g.white_player_id === playerId || g.black_player_id === playerId);
        if (conflict) {
            return `Already playing Board ${conflict.board_number}`;
        }
        return null;
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white w-full max-w-lg p-6 rounded-lg shadow-lg mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h3", { className: "text-xl font-bold", children: ["Swap Players - Board ", game.board_number] }), _jsx("button", { onClick: onClose, className: "text-gray-600 hover:text-black", disabled: loading, children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "mb-4 p-3 bg-gray-100 rounded", children: [_jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Match:" }), " ", getTeamName(match.white_team_id), " vs ", getTeamName(match.black_team_id)] }), _jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Board:" }), " ", game.board_number] })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: error })), loading ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(RefreshCw, { className: "animate-spin mx-auto mb-2", size: 24 }), _jsx("p", { children: "Loading available players..." })] })) : availableSwaps ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["White Player (", getTeamName(match.white_team_id), "):"] }), _jsx("select", { className: "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500", value: selectedWhitePlayer, onChange: (e) => setSelectedWhitePlayer(Number(e.target.value)), disabled: loading, children: availableSwaps.white_team_players.map(player => {
                                        const conflict = getPlayerConflicts(player.id, true);
                                        return (_jsxs("option", { value: player.id, disabled: !!conflict, children: [player.name, " ", player.rating ? `(${player.rating})` : '', conflict ? ` - ${conflict}` : ''] }, player.id));
                                    }) }), selectedWhitePlayer !== game.white_player_id && (_jsxs("p", { className: "text-xs text-blue-600 mt-1", children: ["Will change from: ", getPlayerName(game.white_player_id)] }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Black Player (", getTeamName(match.black_team_id), "):"] }), _jsx("select", { className: "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500", value: selectedBlackPlayer, onChange: (e) => setSelectedBlackPlayer(Number(e.target.value)), disabled: loading, children: availableSwaps.black_team_players.map(player => {
                                        const conflict = getPlayerConflicts(player.id, false);
                                        return (_jsxs("option", { value: player.id, disabled: !!conflict, children: [player.name, " ", player.rating ? `(${player.rating})` : '', conflict ? ` - ${conflict}` : ''] }, player.id));
                                    }) }), selectedBlackPlayer !== game.black_player_id && (_jsxs("p", { className: "text-xs text-blue-600 mt-1", children: ["Will change from: ", getPlayerName(game.black_player_id)] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Reason for swap (optional):" }), _jsx("textarea", { className: "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500", rows: 3, value: swapReason, onChange: (e) => setSwapReason(e.target.value), placeholder: "e.g., Player unavailable, strategic decision...", disabled: loading })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t", children: [_jsx("button", { className: "px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50", onClick: onClose, disabled: loading, children: "Cancel" }), _jsxs("button", { className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center", onClick: executeSwap, disabled: loading || (!selectedWhitePlayer && !selectedBlackPlayer), children: [_jsx(RefreshCw, { className: "mr-1", size: 16 }), loading ? 'Swapping...' : 'Swap Players'] })] })] })) : (_jsx("div", { className: "text-center py-8 text-gray-500", children: "Failed to load available players" }))] }) }));
};
export default PlayerSwapModal;
