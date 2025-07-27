import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// frontend/src/components/Standings.tsx
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
const Standings = ({ isAdmin, onUpdate }) => {
    const [standings, setStandings] = useState([]);
    const [groupStandings, setGroupStandings] = useState({ group_a: [], group_b: [] });
    const [tournament, setTournament] = useState(null);
    useEffect(() => {
        const loadData = async () => {
            try {
                const currentTournament = await apiService.getCurrentTournament();
                setTournament(currentTournament);
                if (currentTournament?.format === 'group_knockout') {
                    const groupData = await apiService.getGroupStandings();
                    setGroupStandings(groupData);
                }
                else {
                    const standingsData = await apiService.getStandings();
                    setStandings(standingsData.standings);
                }
            }
            catch (error) {
                console.error('Error loading standings:', error);
            }
        };
        loadData();
    }, []);
    const renderGroupStandings = (groupName, teams) => (_jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "text-xl font-semibold mb-3 text-gray-800", children: ["Group ", groupName] }), _jsxs("table", { className: "w-full bg-white shadow rounded", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "#" }), _jsx("th", { className: "p-2", children: "Team" }), _jsx("th", { className: "p-2", children: "MP" }), _jsx("th", { className: "p-2", children: "W" }), _jsx("th", { className: "p-2", children: "D" }), _jsx("th", { className: "p-2", children: "L" }), _jsx("th", { className: "p-2", children: "Match Pts" }), _jsx("th", { className: "p-2", children: "Game Pts" }), _jsx("th", { className: "p-2", children: "SB" })] }) }), _jsx("tbody", { children: teams.map((team, idx) => (_jsxs("tr", { className: idx < 2 ? 'bg-green-100 border-l-4 border-green-500' : '', children: [_jsx("td", { className: "p-2 font-semibold", children: idx + 1 }), _jsx("td", { className: "p-2", children: team.name }), _jsx("td", { className: "p-2", children: team.matches_played }), _jsx("td", { className: "p-2", children: team.wins }), _jsx("td", { className: "p-2", children: team.draws }), _jsx("td", { className: "p-2", children: team.losses }), _jsx("td", { className: "p-2 font-semibold", children: team.match_points }), _jsx("td", { className: "p-2", children: team.game_points }), _jsx("td", { className: "p-2", children: team.sonneborn_berger?.toFixed(2) })] }, team.id))) })] })] }));
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Standings" }), tournament?.format === 'group_knockout' ? (_jsxs("div", { children: [_jsx("div", { className: "mb-4 p-3 bg-blue-50 border border-blue-200 rounded", children: _jsxs("p", { className: "text-blue-800", children: [_jsx("strong", { children: "Group + Knockout Format:" }), " Top 2 teams from each group advance to semi-finals"] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx("div", { children: renderGroupStandings('A', groupStandings.group_a) }), _jsx("div", { children: renderGroupStandings('B', groupStandings.group_b) })] }), groupStandings.group_a.length > 0 && groupStandings.group_b.length > 0 && (_jsxs("div", { className: "mt-6 p-4 bg-gray-50 border border-gray-200 rounded", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Knockout Bracket" }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { children: _jsx("strong", { children: "Semi-finals:" }) }), _jsxs("p", { children: ["\u2022 ", groupStandings.group_a[0]?.name, " (A1) vs ", groupStandings.group_b[1]?.name, " (B2)"] }), _jsxs("p", { children: ["\u2022 ", groupStandings.group_a[1]?.name, " (A2) vs ", groupStandings.group_b[0]?.name, " (B1)"] }), _jsxs("p", { className: "mt-2", children: [_jsx("strong", { children: "Final:" }), " Winners of semi-finals"] }), _jsxs("p", { children: [_jsx("strong", { children: "3rd Place:" }), " Losers of semi-finals"] })] })] }))] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4 p-3 bg-blue-50 border border-blue-200 rounded", children: _jsxs("p", { className: "text-blue-800", children: [_jsx("strong", { children: "Round Robin Format:" }), " All teams play against each other once"] }) }), _jsxs("table", { className: "w-full bg-white shadow rounded", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "#" }), _jsx("th", { className: "p-2", children: "Team" }), _jsx("th", { className: "p-2", children: "MP" }), _jsx("th", { className: "p-2", children: "W" }), _jsx("th", { className: "p-2", children: "D" }), _jsx("th", { className: "p-2", children: "L" }), _jsx("th", { className: "p-2", children: "Match Pts" }), _jsx("th", { className: "p-2", children: "Game Pts" }), _jsx("th", { className: "p-2", children: "SB" })] }) }), _jsx("tbody", { children: standings.map((s, idx) => (_jsxs("tr", { children: [_jsx("td", { className: "p-2 font-semibold", children: idx + 1 }), _jsx("td", { className: "p-2", children: s.team_name }), _jsx("td", { className: "p-2", children: s.matches_played }), _jsx("td", { className: "p-2", children: s.wins }), _jsx("td", { className: "p-2", children: s.draws }), _jsx("td", { className: "p-2", children: s.losses }), _jsx("td", { className: "p-2 font-semibold", children: s.match_points }), _jsx("td", { className: "p-2", children: s.game_points }), _jsx("td", { className: "p-2", children: s.sonneborn_berger.toFixed(2) })] }, s.team_id))) })] })] }))] }));
};
export default Standings;
