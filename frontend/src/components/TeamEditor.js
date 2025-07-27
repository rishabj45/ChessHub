import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
const TeamEditor = ({ team, isOpen, onClose, onSave, isAdmin, tournamentStage }) => {
    const [name, setName] = useState(team.name);
    const [players, setPlayers] = useState([]);
    const [originalPlayers, setOriginalPlayers] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerRating, setNewPlayerRating] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Check if editing is disabled (tournament has started)
    const isEditingDisabled = tournamentStage !== 'not_yet_started';
    // Load team players when component opens
    useEffect(() => {
        if (isOpen && team.id) {
            loadTeamPlayers();
        }
    }, [isOpen, team.id]);
    // Reset form when team changes
    useEffect(() => {
        setName(team.name);
        setError(null);
    }, [team]);
    const loadTeamPlayers = async () => {
        try {
            setIsLoading(true);
            const allPlayers = await apiService.getPlayers();
            const teamPlayers = allPlayers.filter(p => p.team_id === team.id);
            setPlayers(teamPlayers);
            setOriginalPlayers([...teamPlayers]); // Deep copy for comparison
        }
        catch (err) {
            setError('Failed to load team players');
            console.error('Error loading players:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    const addPlayer = async () => {
        if (!newPlayerName.trim()) {
            setError('Player name is required');
            return;
        }
        if (players.length >= 6) {
            setError('Maximum 6 players allowed per team');
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const newPlayer = {
                name: newPlayerName.trim(),
                team_id: team.id,
                position: players.length + 1,
                rating: typeof newPlayerRating === 'number' ? newPlayerRating : 1200, // Default rating
            };
            const createdPlayer = await apiService.addPlayer(newPlayer);
            setPlayers(prev => [...prev, createdPlayer]);
            setNewPlayerName('');
            setNewPlayerRating('');
        }
        catch (err) {
            setError(err.response?.data?.detail || 'Failed to add player');
            console.error('Error adding player:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    const removePlayer = async (playerIndex) => {
        const player = players[playerIndex];
        if (!player.id)
            return;
        if (players.length <= 4) {
            setError('Minimum 4 players required per team');
            return;
        }
        if (!confirm(`Are you sure you want to delete player "${player.name}"?`))
            return;
        try {
            setIsLoading(true);
            setError(null);
            await apiService.deletePlayer(player.id);
            setPlayers(prev => prev.filter((_, i) => i !== playerIndex));
        }
        catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete player');
            console.error('Error deleting player:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    const updatePlayerName = (index, newName) => {
        setPlayers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], name: newName };
            return updated;
        });
    };
    const updatePlayerRating = (index, newRating) => {
        setPlayers(prev => {
            const updated = [...prev];
            const rating = newRating === '' ? null : parseInt(newRating);
            updated[index] = { ...updated[index], rating: rating || undefined };
            return updated;
        });
    };
    const save = async () => {
        if (!name.trim()) {
            setError('Team name is required');
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            // Update players that have changed
            const playerUpdates = players
                .filter(player => {
                const original = originalPlayers.find(op => op.id === player.id);
                return original && (player.name !== original.name ||
                    player.rating !== original.rating);
            })
                .map(player => apiService.updatePlayer(player.id, {
                name: player.name,
                rating: player.rating,
                position: player.position
            }));
            await Promise.all(playerUpdates);
            // Create updated team object
            const updatedTeam = {
                ...team,
                name: name.trim(),
                players: players,
            };
            onSave(updatedTeam);
            onClose();
        }
        catch (err) {
            setError(err.response?.data?.detail || 'Failed to save changes');
            console.error('Error saving team:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleClose = () => {
        // Reset form state
        setName(team.name);
        setPlayers([]);
        setOriginalPlayers([]);
        setNewPlayerName('');
        setNewPlayerRating('');
        setError(null);
        onClose();
    };
    if (!isOpen || !isAdmin)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-semibold", children: "Edit Team" }), _jsx("button", { onClick: handleClose, className: "text-gray-500 hover:text-gray-700", disabled: isLoading, children: _jsx(X, { size: 20 }) })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: error })), isEditingDisabled && (_jsxs("div", { className: "mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded", children: [_jsx("strong", { children: "\u26A0\uFE0F Tournament has started" }), " - Teams and players cannot be edited after the tournament begins."] })), isLoading && (_jsx("div", { className: "mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded", children: "Loading..." })), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-medium text-gray-700", children: "Team Name:" }), _jsx("input", { className: "w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed", value: name, onChange: e => setName(e.target.value), disabled: isLoading || isEditingDisabled, placeholder: "Enter team name" })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block mb-1 font-medium text-gray-700", children: ["Players (", players.length, "/6):"] }), players.length > 0 ? (_jsx("div", { className: "mb-3 space-y-2 max-h-60 overflow-y-auto", children: players.map((player, index) => (_jsxs("div", { className: "flex items-center space-x-2 p-2 border border-gray-200 rounded", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { className: "w-full border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed", value: player.name, onChange: e => updatePlayerName(index, e.target.value), disabled: isLoading || isEditingDisabled, placeholder: "Player name" }) }), _jsx("div", { className: "w-20", children: _jsx("input", { type: "number", className: "w-full border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed", value: player.rating || '', onChange: e => updatePlayerRating(index, e.target.value), disabled: isLoading || isEditingDisabled, placeholder: "Rating", min: "0", max: "3000" }) }), _jsx("button", { onClick: () => removePlayer(index), className: "text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed", disabled: isLoading || players.length <= 4 || isEditingDisabled, title: isEditingDisabled
                                            ? "Cannot edit after tournament starts"
                                            : players.length <= 4
                                                ? "Minimum 4 players required"
                                                : "Remove player", children: _jsx(Trash2, { size: 16 }) })] }, player.id ?? index))) })) : (_jsx("p", { className: "text-gray-500 text-sm mb-3", children: "No players loaded yet..." })), !isEditingDisabled && (_jsxs("div", { className: "border-t pt-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { className: "flex-1 border border-gray-300 px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-500", placeholder: "New player name", value: newPlayerName, onChange: e => setNewPlayerName(e.target.value), disabled: isLoading || players.length >= 6, onKeyPress: e => e.key === 'Enter' && addPlayer() }), _jsx("input", { type: "number", className: "w-20 border border-gray-300 px-2 py-2 rounded text-sm focus:outline-none focus:border-blue-500", placeholder: "Rating", value: newPlayerRating, onChange: e => setNewPlayerRating(e.target.value === '' ? '' : parseInt(e.target.value)), disabled: isLoading || players.length >= 6, min: "0", max: "3000", onKeyPress: e => e.key === 'Enter' && addPlayer() }), _jsx("button", { className: "px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed", onClick: addPlayer, disabled: !newPlayerName.trim() || isLoading || players.length >= 6, title: players.length >= 6 ? "Maximum 6 players allowed" : "Add player", children: _jsx(Plus, { size: 16 }) })] }), players.length >= 6 && (_jsx("p", { className: "text-sm text-orange-600 mt-1", children: "Maximum 6 players per team" }))] }))] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4 border-t", children: [_jsx("button", { className: "px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50", onClick: handleClose, disabled: isLoading, children: "Cancel" }), _jsxs("button", { className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center", onClick: save, disabled: !name.trim() || isLoading || isEditingDisabled, children: [_jsx(Save, { className: "inline-block mr-1", size: 16 }), isLoading ? 'Saving...' : isEditingDisabled ? 'Read Only' : 'Save'] })] })] }) }));
};
export default TeamEditor;
