import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Trophy, Calendar, Play, Trash2, Crown, MapPin } from 'lucide-react';
import TournamentCreator from './TournamentCreator';
import { apiService } from '@/services/api';
import { getFormatDisplayText, getStageDisplayText } from '@/utils/helpers';
const TournamentManager = ({ isAdmin, currentTournament, onTournamentChanged }) => {
    const [tournaments, setTournaments] = useState([]);
    const [showCreator, setShowCreator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [settingCurrent, setSettingCurrent] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    // State for completing tournaments
    const [completing, setCompleting] = useState(null);
    useEffect(() => {
        loadTournaments();
    }, []);
    const loadTournaments = async () => {
        try {
            setLoading(true);
            const allTournaments = await apiService.getTournaments();
            setTournaments(allTournaments);
            setError(null);
        }
        catch (err) {
            console.error('Error loading tournaments:', err);
            setError('Failed to load tournaments');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSetCurrent = async (tournament) => {
        if (!isAdmin) {
            setError('Admin access required to set current tournament');
            return;
        }
        try {
            setSettingCurrent(tournament.id);
            await apiService.setCurrentTournament(tournament.id);
            await loadTournaments(); // Refresh the tournament list
            await onTournamentChanged(); // Refresh the current tournament in the app
            setError(null);
        }
        catch (err) {
            console.error('Error setting current tournament:', err);
            setError(err.response?.data?.detail || 'Failed to set current tournament');
        }
        finally {
            setSettingCurrent(null);
        }
    };
    const handleDeleteConfirm = (tournamentId) => {
        setShowDeleteConfirm(tournamentId);
    };
    const handleDeleteCancel = () => {
        setShowDeleteConfirm(null);
    };
    const handleDeleteTournament = async (tournamentId) => {
        if (!isAdmin) {
            setError('Admin access required to delete tournaments');
            return;
        }
        try {
            setDeleting(tournamentId);
            setShowDeleteConfirm(null);
            await apiService.deleteTournament(tournamentId);
            await loadTournaments(); // Refresh the tournament list
            await onTournamentChanged(); // Refresh the current tournament in the app
            setError(null);
        }
        catch (err) {
            console.error('Error deleting tournament:', err);
            setError(err.response?.data?.detail || 'Failed to delete tournament');
        }
        finally {
            setDeleting(null);
        }
    };
    const handleTournamentCreated = async () => {
        setShowCreator(false);
        await loadTournaments();
        await onTournamentChanged();
    };
    const handleCompleteTournament = async (tournamentId) => {
        setCompleting(tournamentId);
        try {
            await apiService.completeTournament(tournamentId);
            await loadTournaments();
            await onTournamentChanged();
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to complete tournament';
            alert(`❌ Error: ${errorMessage}`);
        }
        finally {
            setCompleting(null);
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (showCreator) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-800 flex items-center", children: [_jsx(Trophy, { className: "mr-2 text-yellow-500" }), "Create New Tournament"] }), _jsx("button", { onClick: () => setShowCreator(false), className: "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700", children: "Back to Tournaments" })] }), _jsx(TournamentCreator, { isAdmin: isAdmin, onTournamentCreated: handleTournamentCreated })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-800 flex items-center", children: [_jsx(Trophy, { className: "mr-2 text-yellow-500" }), "Tournaments"] }), isAdmin && (_jsxs("button", { onClick: () => setShowCreator(true), className: "flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Create Tournament" })] }))] }), error && (_jsx("div", { className: "p-3 bg-red-100 border border-red-300 text-red-700 rounded", children: error })), loading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : tournaments.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Trophy, { className: "mx-auto text-6xl text-gray-400 mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-600 mb-2", children: "No Tournaments Found" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Get started by creating your first tournament." }), isAdmin && (_jsx("button", { onClick: () => setShowCreator(true), className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: "Create Tournament" }))] })) : (_jsx("div", { className: "grid gap-4", children: tournaments.map((tournament) => (_jsx("div", { className: `bg-white rounded-lg shadow-md p-6 border-l-4 ${currentTournament?.id === tournament.id
                        ? 'border-l-yellow-500 bg-yellow-50'
                        : 'border-l-blue-500'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-800", children: tournament.name }), currentTournament?.id === tournament.id && (_jsxs("div", { className: "flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm", children: [_jsx(Crown, { className: "w-3 h-3 mr-1" }), "Current"] })), _jsx("span", { className: "px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200", children: getFormatDisplayText(tournament) })] }), tournament.description && (_jsx("p", { className: "text-gray-600 mb-3", children: tournament.description })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center text-gray-600", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Start" }), _jsx("div", { children: formatDate(tournament.start_date) })] })] }), _jsxs("div", { className: "flex items-center text-gray-600", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "End" }), _jsx("div", { children: formatDate(tournament.end_date) })] })] }), _jsxs("div", { className: "flex items-center text-gray-600", children: [_jsx(MapPin, { className: "w-4 h-4 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Venue" }), _jsx("div", { className: "text-sm", children: tournament.venue || 'TBD' })] })] }), _jsxs("div", { className: "flex items-center text-gray-600", children: [_jsx(Trophy, { className: "w-4 h-4 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Stage" }), _jsx("div", { className: "text-sm", children: getStageDisplayText(tournament) })] })] })] })] }), isAdmin && (_jsxs("div", { className: "ml-4 flex flex-col space-y-2", children: [currentTournament?.id !== tournament.id && (_jsx("button", { onClick: () => handleSetCurrent(tournament), disabled: settingCurrent === tournament.id || deleting === tournament.id, className: "flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50", children: settingCurrent === tournament.id ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), _jsx("span", { children: "Setting..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Play, { className: "w-4 h-4" }), _jsx("span", { children: "Set as Current" })] })) })), _jsx("button", { onClick: () => handleDeleteConfirm(tournament.id), disabled: settingCurrent === tournament.id || deleting === tournament.id, className: "flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50", children: deleting === tournament.id ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), _jsx("span", { children: "Deleting..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "w-4 h-4" }), _jsx("span", { children: "Delete" })] })) })] }))] }) }, tournament.id))) })), showDeleteConfirm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Confirm Delete Tournament" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Are you sure you want to delete this tournament? This action cannot be undone and will remove all associated data including teams, players, matches, and games." }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: handleDeleteCancel, className: "flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300", children: "Cancel" }), _jsx("button", { onClick: () => handleDeleteTournament(showDeleteConfirm), className: "flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700", children: "Delete Tournament" })] })] }) }))] }));
};
export default TournamentManager;
