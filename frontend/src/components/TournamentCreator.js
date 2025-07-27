import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, Minus, Calendar, Trophy, Users, Info } from 'lucide-react';
import { apiService } from '@/services/api';
const TournamentCreator = ({ isAdmin, onTournamentCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        venue: '',
        startDate: '',
        endDate: '',
        format: 'round_robin',
        teams: [
            { name: 'Team 1', playerCount: 4 },
            { name: 'Team 2', playerCount: 4 },
            { name: 'Team 3', playerCount: 4 },
            { name: 'Team 4', playerCount: 4 },
        ],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(null);
    };
    const handleTeamChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            teams: prev.teams.map((team, i) => i === index ? { ...team, [field]: value } : team),
        }));
        setError(null);
        setSuccess(null);
    };
    const addTeam = () => {
        setFormData(prev => ({
            ...prev,
            teams: [...prev.teams, { name: `Team ${prev.teams.length + 1}`, playerCount: 4 }],
        }));
    };
    const removeTeam = (index) => {
        if (formData.teams.length <= 2) {
            setError('Minimum 2 teams required');
            return;
        }
        setFormData(prev => ({
            ...prev,
            teams: prev.teams.filter((_, i) => i !== index),
        }));
    };
    const validateForm = () => {
        if (!formData.name.trim())
            return 'Tournament name is required';
        if (formData.teams.length < 2)
            return 'At least 2 teams are required';
        for (let i = 0; i < formData.teams.length; i++) {
            const team = formData.teams[i];
            if (!team.name.trim())
                return `Team ${i + 1} name is required`;
            if (team.playerCount < 1 || team.playerCount > 8)
                return `Team ${i + 1} must have 1-8 players`;
        }
        // Check for duplicate team names
        const teamNames = formData.teams.map(t => t.name.trim().toLowerCase());
        const uniqueNames = new Set(teamNames);
        if (teamNames.length !== uniqueNames.size)
            return 'Team names must be unique';
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            return 'End date must be after start date';
        }
        // Format-specific validation
        if (formData.format === 'group_knockout') {
            if (formData.teams.length < 4) {
                return 'Group + Knockout format requires at least 4 teams';
            }
            if (formData.teams.length % 2 !== 0) {
                return 'Group + Knockout format requires an even number of teams';
            }
        }
        return null;
    };
    const calculateRounds = () => {
        const numTeams = formData.teams.length;
        if (numTeams < 2)
            return 0;
        if (formData.format === 'round_robin') {
            // Round-robin: each team plays every other team once
            // For odd number of teams, we need n rounds
            // For even number of teams, we need n-1 rounds
            return numTeams % 2 === 0 ? numTeams - 1 : numTeams;
        }
        else if (formData.format === 'group_knockout') {
            // Group stage rounds + knockout rounds
            const teamsPerGroup = Math.floor(numTeams / 2);
            const groupRounds = teamsPerGroup % 2 === 0 ? teamsPerGroup - 1 : teamsPerGroup;
            const knockoutRounds = 2; // Semi-finals, Final (with 3rd place in same round)
            return groupRounds + knockoutRounds;
        }
        return 0;
    };
    const calculateMatches = () => {
        const numTeams = formData.teams.length;
        if (numTeams < 2)
            return 0;
        if (formData.format === 'round_robin') {
            // Total matches in round-robin = n * (n-1) / 2
            return (numTeams * (numTeams - 1)) / 2;
        }
        else if (formData.format === 'group_knockout') {
            // Group stage matches + knockout matches
            const teamsPerGroup = Math.floor(numTeams / 2);
            const groupMatches = 2 * (teamsPerGroup * (teamsPerGroup - 1)) / 2; // 2 groups
            const knockoutMatches = 4; // 2 semi-finals + final + 3rd place (final & 3rd in same round)
            return groupMatches + knockoutMatches;
        }
        return 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!isAdmin) {
            setError('Admin access required to create tournaments');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const tournamentData = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                venue: formData.venue.trim() || null,
                start_date: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                team_names: formData.teams.map(t => t.name.trim()),
                players_per_team: formData.teams.map(t => t.playerCount),
                format: formData.format,
            };
            // Create the tournament
            const createdTournament = await apiService.createTournament(tournamentData);
            try {
                // Automatically set the newly created tournament as current
                await apiService.setCurrentTournament(createdTournament.id);
                setSuccess('Tournament created successfully and set as current!');
            }
            catch (setCurrentError) {
                console.warn('Failed to set tournament as current:', setCurrentError);
                setSuccess('Tournament created successfully! However, failed to set as current - you can set it manually from the tournament list.');
            }
            onTournamentCreated();
            // Reset form
            setFormData({
                name: '',
                description: '',
                venue: '',
                startDate: '',
                endDate: '',
                format: 'round_robin',
                teams: [
                    { name: 'Team 1', playerCount: 4 },
                    { name: 'Team 2', playerCount: 4 },
                    { name: 'Team 3', playerCount: 4 },
                    { name: 'Team 4', playerCount: 4 },
                ],
            });
        }
        catch (err) {
            console.error('Error creating tournament:', err);
            setError(err.response?.data?.detail || 'Failed to create tournament');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (!isAdmin) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(Trophy, { className: "mx-auto text-6xl text-gray-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-600 mb-2", children: "Admin Access Required" }), _jsx("p", { className: "text-gray-500", children: "You need admin privileges to create tournaments." })] }) }));
    }
    return (_jsx("div", { className: "max-w-4xl mx-auto space-y-6", children: _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-6", children: [_jsx(Trophy, { className: "text-yellow-500 text-2xl" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "Create New Tournament" })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded", children: error })), success && (_jsx("div", { className: "mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded", children: success })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tournament Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Enter tournament name", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("input", { type: "text", value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Tournament description (optional)", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Venue" }), _jsx("input", { type: "text", value: formData.venue, onChange: (e) => handleInputChange('venue', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Tournament venue (optional)", disabled: isLoading })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "inline w-4 h-4 mr-1" }), "Start Date"] }), _jsx("input", { type: "datetime-local", value: formData.startDate, onChange: (e) => handleInputChange('startDate', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: isLoading })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "inline w-4 h-4 mr-1" }), "End Date"] }), _jsx("input", { type: "datetime-local", value: formData.endDate, onChange: (e) => handleInputChange('endDate', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: isLoading })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Trophy, { className: "inline w-4 h-4 mr-1" }), "Tournament Format *"] }), _jsxs("select", { value: formData.format, onChange: (e) => handleInputChange('format', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: isLoading, children: [_jsx("option", { value: "round_robin", children: "Round Robin - All teams play each other" }), _jsx("option", { value: "group_knockout", children: "Group + Knockout - Teams split into groups, top 2 advance to knockout" })] }), formData.format === 'group_knockout' && (_jsx("div", { className: "mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md", children: _jsxs("p", { className: "text-sm text-yellow-800", children: [_jsx("strong", { children: "Group + Knockout Format:" }), _jsx("br", {}), "\u2022 Teams are split into 2 groups", _jsx("br", {}), "\u2022 Each group plays round-robin", _jsx("br", {}), "\u2022 Top 2 from each group advance to semi-finals", _jsx("br", {}), "\u2022 Semi-finals: A1 vs B2, A2 vs B1", _jsx("br", {}), "\u2022 Final & 3rd place matches (in same round)", _jsx("br", {}), "\u2022 Requires even number of teams (minimum 4)"] }) }))] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-800 mb-3 flex items-center", children: [_jsx(Info, { className: "w-5 h-5 mr-2 text-blue-500" }), "Tournament Statistics"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: formData.teams.length }), _jsx("div", { className: "text-gray-600", children: "Teams" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: calculateRounds() }), _jsx("div", { className: "text-gray-600", children: "Rounds" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: calculateMatches() }), _jsx("div", { className: "text-gray-600", children: "Total Matches" })] })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-800 flex items-center", children: [_jsx(Users, { className: "w-5 h-5 mr-2 text-blue-500" }), "Teams Setup"] }), _jsxs("button", { type: "button", onClick: addTeam, className: "flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50", disabled: isLoading, children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Add Team" })] })] }), _jsx("div", { className: "space-y-3", children: formData.teams.map((team, index) => (_jsxs("div", { className: "flex items-center space-x-3 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { type: "text", value: team.name, onChange: (e) => handleTeamChange(index, 'name', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: `Team ${index + 1} name`, disabled: isLoading }) }), _jsx("div", { className: "w-32", children: _jsx("input", { type: "number", min: "1", max: "8", value: team.playerCount, onChange: (e) => handleTeamChange(index, 'playerCount', parseInt(e.target.value) || 4), className: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500", disabled: isLoading }) }), _jsx("button", { type: "button", onClick: () => removeTeam(index), className: "p-2 text-red-600 hover:text-red-800 disabled:opacity-50", disabled: isLoading || formData.teams.length <= 2, title: "Remove team", children: _jsx(Minus, { className: "w-4 h-4" }) })] }, index))) })] }), _jsx("div", { className: "flex justify-end space-x-3", children: _jsx("button", { type: "submit", disabled: isLoading, className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), _jsx("span", { children: "Creating Tournament..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Trophy, { className: "w-4 h-4" }), _jsx("span", { children: "Create Tournament" })] })) }) })] })] }) }));
};
export default TournamentCreator;
