import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/Standings.tsx
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
const Standings = () => {
    const [standings, setStandings] = useState([]);
    useEffect(() => {
        apiService.getStandings().then(data => setStandings(data.standings));
    }, []);
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Standings" }), _jsxs("table", { className: "w-full bg-white shadow rounded", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "#" }), _jsx("th", { className: "p-2", children: "Team" }), _jsx("th", { className: "p-2", children: "MP" }), _jsx("th", { className: "p-2", children: "W" }), _jsx("th", { className: "p-2", children: "D" }), _jsx("th", { className: "p-2", children: "L" }), _jsx("th", { className: "p-2", children: "Match Pts" }), _jsx("th", { className: "p-2", children: "Game Pts" }), _jsx("th", { className: "p-2", children: "SB" })] }) }), _jsx("tbody", { children: standings.map((s, idx) => (_jsxs("tr", { children: [_jsx("td", { className: "p-2 font-semibold", children: idx + 1 }), _jsx("td", { className: "p-2", children: s.team_name }), _jsx("td", { className: "p-2", children: s.matches_played }), _jsx("td", { className: "p-2", children: s.wins }), _jsx("td", { className: "p-2", children: s.draws }), _jsx("td", { className: "p-2", children: s.losses }), _jsx("td", { className: "p-2 font-semibold", children: s.match_points }), _jsx("td", { className: "p-2", children: s.game_points }), _jsx("td", { className: "p-2", children: s.sonneborn_berger.toFixed(2) })] }, s.team_id))) })] })] }));
};
export default Standings;
