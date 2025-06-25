import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/BestPlayers.tsx
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
const BestPlayers = () => {
    const [players, setPlayers] = useState([]);
    useEffect(() => {
        apiService.getBestPlayers().then(data => setPlayers(data.players));
    }, []);
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Best Players" }), _jsxs("table", { className: "w-full bg-white shadow rounded", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "Player" }), _jsx("th", { className: "p-2", children: "Games" }), _jsx("th", { className: "p-2", children: "Wins" }), _jsx("th", { className: "p-2", children: "Draws" }), _jsx("th", { className: "p-2", children: "Losses" }), _jsx("th", { className: "p-2", children: "Points" })] }) }), _jsx("tbody", { children: players.map((p, i) => (_jsxs("tr", { children: [_jsx("td", { className: "p-2", children: p.player_name }), _jsx("td", { className: "p-2", children: p.games_played }), _jsx("td", { className: "p-2", children: p.wins }), _jsx("td", { className: "p-2", children: p.draws }), _jsx("td", { className: "p-2", children: p.losses }), _jsx("td", { className: "p-2", children: p.points })] }, p.player_id))) })] })] }));
};
export default BestPlayers;
