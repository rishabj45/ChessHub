import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/MatchResult.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { apiService } from '@/services/api';
const MatchResult = ({ match, onClose, players }) => {
    const [results, setResults] = useState(match.games.map((g) => ({
        board: g.board_number,
        result: g.result || "pending"
    })));
    const submitResults = async () => {
        try {
            for (const r of results) {
                if (r.result !== "pending") {
                    await apiService.submitBoardResult(match.id, r.board, { result: r.result });
                }
            }
            onClose();
        }
        catch (err) {
            console.error('Failed to submit match result', err);
            alert('Error submitting results');
        }
    };
    const getPlayerName = (id) => players.find((p) => p.id === id)?.name || `Player ${id}`;
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white w-full max-w-md p-4 rounded shadow-md mx-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h4", { className: "font-bold text-lg", children: "Match Results" }), _jsx("button", { onClick: onClose, className: "text-gray-600 hover:text-black", children: _jsx(X, {}) })] }), match.games.map((game, idx) => (_jsxs("div", { className: "flex items-center mb-3 space-x-2", children: [_jsxs("span", { className: "w-24", children: ["Board ", game.board_number, ":"] }), _jsxs("select", { className: "border px-2 py-1 rounded", value: results[idx].result, onChange: (e) => {
                                const val = e.target.value;
                                setResults((prev) => {
                                    const nr = [...prev];
                                    nr[idx].result = val;
                                    return nr;
                                });
                            }, children: [_jsx("option", { value: "pending", children: "Pending" }), _jsxs("option", { value: "white_win", children: [getPlayerName(game.white_player_id), " "] }), _jsxs("option", { value: "black_win", children: [getPlayerName(game.black_player_id), " "] }), _jsx("option", { value: "draw", children: "Draw" })] }), game.result && (_jsxs("span", { className: "text-xs text-green-600", children: ["was:", " ", game.result === "white_win"
                                    ? getPlayerName(game.white_player_id)
                                    : game.result === "black_win"
                                        ? getPlayerName(game.black_player_id)
                                        : game.result === "draw"
                                            ? "Draw"
                                            : "Pending"] }))] }, game.id))), _jsx("button", { className: "mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: submitResults, children: "Submit Results" })] }) }));
};
export default MatchResult;
