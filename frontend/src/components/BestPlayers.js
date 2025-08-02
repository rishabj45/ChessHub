import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/BestPlayers.tsx
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { apiService } from '@/services/api';
const BestPlayers = () => {
    const [players, setPlayers] = useState([]);
    useEffect(() => {
        apiService.getBestPlayers().then(data => setPlayers(data.players));
    }, []);
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Best Players" }), players.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(Trophy, { className: "mx-auto h-16 w-16 text-gray-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-600 mb-2", children: "No Player Data Available" }), _jsx("p", { className: "text-gray-500", children: "Player statistics will appear here once tournaments are completed." })] }) })) : (_jsx("div", { className: "overflow-auto max-h-96", children: _jsxs("table", { className: "w-full bg-white shadow rounded", children: [_jsx("thead", { className: "bg-gray-100 sticky top-0 z-10", children: _jsxs("tr", { children: [_jsx("th", { className: "p-2 bg-gray-100 text-center", children: "#" }), _jsx("th", { className: "p-2 bg-gray-100 text-left", children: "Player" }), _jsx("th", { className: "p-2 bg-gray-100 text-center", children: "Games" }), _jsx("th", { className: "p-2 bg-gray-100 text-center", children: "Wins" }), _jsx("th", { className: "p-2 bg-gray-100 text-center", children: "Draws" }), _jsx("th", { className: "p-2 bg-gray-100 text-center", children: "Losses" }), _jsx("th", { className: "p-2 bg-gray-100 text-center", children: "Points" })] }) }), _jsx("tbody", { children: players.map((p, i) => (_jsxs("tr", { children: [_jsx("td", { className: "p-2 font-semibold text-center", children: i + 1 }), _jsx("td", { className: "p-2 text-left", children: p.player_name }), _jsx("td", { className: "p-2 text-center", children: p.games_played }), _jsx("td", { className: "p-2 text-center", children: p.wins }), _jsx("td", { className: "p-2 text-center", children: p.draws }), _jsx("td", { className: "p-2 text-center", children: p.losses }), _jsx("td", { className: "p-2 text-center", children: p.points })] }, p.player_id))) })] }) }))] }));
};
export default BestPlayers;
