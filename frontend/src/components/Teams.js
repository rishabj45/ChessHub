import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import TeamEditor from './TeamEditor';
import { apiService } from '@/services/api';
const Teams = ({ isAdmin, tournament }) => {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [showEditor, setShowEditor] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    useEffect(() => {
        if (!tournament)
            return;
        // Step 1: Load teams
        apiService.getTeams().then(allTeams => {
            const filtered = allTeams.filter(team => team.tournament_id === tournament.id);
            setTeams(filtered);
        });
        // Step 2: Load all players
        apiService.getPlayers().then(setPlayers);
    }, [tournament]);
    const handleEdit = (team) => {
        setSelectedTeam(team);
        setShowEditor(true);
    };
    const handleSave = async (team) => {
        await apiService.updateTeam(team.id, team);
        setTeams(ts => ts.map(t => (t.id === team.id ? team : t)));
        setShowEditor(false);
    };
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl mb-4", children: "Teams" }), teams.length === 0 ? (_jsx("p", { children: "No teams found for this tournament." })) : (_jsx("ul", { className: "mt-4 space-y-4", children: teams.map(team => {
                    const teamPlayers = players.filter(p => p.team_id === team.id);
                    return (_jsxs("li", { className: "bg-white p-4 rounded shadow space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, {}), _jsx("span", { className: "font-semibold", children: team.name })] }), isAdmin && (_jsx("button", { className: "px-2 py-1 border rounded text-blue-500", onClick: () => handleEdit(team), children: "Edit" }))] }), _jsx("div", { className: "ml-6 text-sm text-gray-700", children: teamPlayers.length > 0 ? (_jsx("ul", { className: "list-disc space-y-1", children: teamPlayers.map(player => (_jsxs("li", { children: [_jsx("span", { children: player.name }), _jsxs("span", { className: "text-gray-500 ml-2 text-xs", children: ["(Rating: ", player.rating, ")"] })] }, player.id))) })) : (_jsx("p", { className: "text-gray-400", children: "No players assigned" })) })] }, team.id));
                }) })), showEditor && selectedTeam && (_jsx(TeamEditor, { team: selectedTeam, isOpen: showEditor, onClose: () => setShowEditor(false), onSave: handleSave, isAdmin: isAdmin }))] }));
};
export default Teams;
