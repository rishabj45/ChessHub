import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/MatchResult.tsx
import { useState } from 'react';
import { X, Crown, Minus, RotateCcw } from 'lucide-react';
import { apiService } from '@/services/api';
const MatchResult = ({ match, onClose, players }) => {
    const [results, setResults] = useState(match.games.map((g) => ({
        board: g.board_number,
        result: g.result || "pending"
    })));
    const submitResults = async () => {
        try {
            for (const r of results) {
                // Always submit the result, including "pending" to reset games
                await apiService.submitBoardResult(match.id, r.board, { result: r.result });
            }
            onClose();
        }
        catch (err) {
            console.error('Failed to submit match result', err);
            alert('Error submitting results');
        }
    };
    const getPlayerName = (id) => players.find((p) => p.id === id)?.name || `Player ${id}`;
    const toggleResult = (gameIndex, resultType) => {
        setResults((prev) => {
            const newResults = [...prev];
            // If the same result is clicked, toggle it to "pending", otherwise set the new result
            newResults[gameIndex].result = newResults[gameIndex].result === resultType ? "pending" : resultType;
            return newResults;
        });
    };
    const getResultIcon = (resultType) => {
        switch (resultType) {
            case 'white_win':
            case 'black_win':
                return _jsx(Crown, { className: "w-4 h-4" });
            case 'draw':
                return _jsx(Minus, { className: "w-4 h-4" });
            case 'pending':
                return _jsx(RotateCcw, { className: "w-4 h-4" });
            default:
                return null;
        }
    };
    const getResultButtonClass = (currentResult, buttonType) => {
        const isSelected = currentResult === buttonType;
        const baseClass = "flex items-center gap-1 px-3 py-2 rounded transition-all text-sm font-medium";
        switch (buttonType) {
            case 'white_win':
                return `${baseClass} ${isSelected
                    ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50'} border`;
            case 'black_win':
                return `${baseClass} ${isSelected
                    ? 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'} border`;
            case 'draw':
                return `${baseClass} ${isSelected
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-700 ring-2 ring-yellow-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-yellow-50'} border`;
            case 'pending':
                return `${baseClass} ${isSelected
                    ? 'bg-gray-100 border-gray-500 text-gray-700 ring-2 ring-gray-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} border`;
            default:
                return baseClass;
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h4", { className: "font-bold text-xl", children: "Match Results" }), _jsx("button", { onClick: onClose, className: "text-gray-600 hover:text-black", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "space-y-6", children: match.games.map((game, idx) => (_jsxs("div", { className: "border rounded-lg p-4 bg-gray-50", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h5", { className: "font-semibold text-lg", children: ["Board ", game.board_number] }), game.result && game.result !== "pending" && (_jsxs("span", { className: "text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded", children: ["Previously: ", game.result === "white_win" ? getPlayerName(game.white_player_id) :
                                                game.result === "black_win" ? getPlayerName(game.black_player_id) :
                                                    game.result === "draw" ? "Draw" : "Pending"] }))] }), _jsx("div", { className: "mb-4", children: _jsxs("div", { className: "text-sm text-gray-600 mb-2", children: [_jsx("span", { className: "font-medium", children: "White:" }), " ", getPlayerName(game.white_player_id), " vs", ' ', _jsx("span", { className: "font-medium", children: "Black:" }), " ", getPlayerName(game.black_player_id)] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [_jsxs("button", { onClick: () => toggleResult(idx, 'white_win'), className: getResultButtonClass(results[idx].result, 'white_win'), children: [getResultIcon('white_win'), _jsx("span", { children: "White Wins" }), results[idx].result === 'white_win' && _jsx("span", { className: "ml-1", children: "\u2713" })] }), _jsxs("button", { onClick: () => toggleResult(idx, 'black_win'), className: getResultButtonClass(results[idx].result, 'black_win'), children: [getResultIcon('black_win'), _jsx("span", { children: "Black Wins" }), results[idx].result === 'black_win' && _jsx("span", { className: "ml-1", children: "\u2713" })] }), _jsxs("button", { onClick: () => toggleResult(idx, 'draw'), className: getResultButtonClass(results[idx].result, 'draw'), children: [getResultIcon('draw'), _jsx("span", { children: "Draw" }), results[idx].result === 'draw' && _jsx("span", { className: "ml-1", children: "\u2713" })] }), _jsxs("button", { onClick: () => toggleResult(idx, 'pending'), className: getResultButtonClass(results[idx].result, 'pending'), children: [getResultIcon('pending'), _jsx("span", { children: "Reset" }), results[idx].result === 'pending' && _jsx("span", { className: "ml-1", children: "\u2713" })] })] }), _jsxs("div", { className: "mt-3 text-sm", children: [_jsx("span", { className: "font-medium", children: "Current result: " }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${results[idx].result === 'white_win' ? 'bg-green-100 text-green-800' :
                                            results[idx].result === 'black_win' ? 'bg-blue-100 text-blue-800' :
                                                results[idx].result === 'draw' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`, children: results[idx].result === 'white_win' ? `${getPlayerName(game.white_player_id)} wins` :
                                            results[idx].result === 'black_win' ? `${getPlayerName(game.black_player_id)} wins` :
                                                results[idx].result === 'draw' ? 'Draw' : 'Pending' })] })] }, game.id))) }), _jsxs("div", { className: "flex justify-between items-center mt-6 pt-4 border-t", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Click a result button again to unselect it" }), _jsx("button", { className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium", onClick: submitResults, children: "Update Results" })] })] }) }));
};
export default MatchResult;
