import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Trophy, Calendar, MapPin, Info, Users, Target, Crown } from 'lucide-react';
const TournamentHome = ({ tournament, isAdmin, onUpdate }) => {
    const [canComplete, setCanComplete] = useState(false);
    const [finalRankings, setFinalRankings] = useState(null);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [groupStandings, setGroupStandings] = useState({ group_a: [], group_b: [] });
    useEffect(() => {
        const loadAdminData = async () => {
            if (!tournament || !isAdmin)
                return;
            try {
                if (tournament.format === 'group_knockout') {
                    const groupData = await apiService.getGroupStandings();
                    setGroupStandings(groupData);
                    // Check completion possibility for final stage
                    if (tournament.stage === 'final') {
                        const completeData = await apiService.canCompleteTournament(tournament.id);
                        setCanComplete(completeData.can_complete);
                    }
                }
                // Get final rankings if tournament is completed
                if (tournament.stage === 'completed') {
                    const rankings = await apiService.getFinalRankings(tournament.id);
                    setFinalRankings(rankings);
                }
            }
            catch (error) {
                console.error('Error loading admin data:', error);
            }
        };
        loadAdminData();
    }, [tournament, isAdmin]);
    const handleCompleteTournament = async () => {
        if (!tournament || !canComplete)
            return;
        setIsAdvancing(true);
        try {
            await apiService.completeTournament(tournament.id);
            alert('Tournament completed! Final rankings are now available.');
            onUpdate();
            setCanComplete(false);
            // Get final rankings
            const rankings = await apiService.getFinalRankings(tournament.id);
            setFinalRankings(rankings);
        }
        catch (error) {
            console.error('Error completing tournament:', error);
            alert('Failed to complete tournament');
        }
        finally {
            setIsAdvancing(false);
        }
    };
    const handleStartTournament = async () => {
        if (!tournament)
            return;
        setIsAdvancing(true);
        try {
            await apiService.startTournament(tournament.id);
            alert('Tournament started! Teams and players can no longer be edited.');
            onUpdate(); // Refresh tournament data
        }
        catch (error) {
            console.error('Error starting tournament:', error);
            alert('Failed to start tournament. Make sure you have at least 2 teams.');
        }
        finally {
            setIsAdvancing(false);
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'TBD';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getStageDescription = (stage, format) => {
        if (format === 'group_knockout') {
            switch (stage) {
                case 'not_yet_started':
                    return 'Tournament has not started yet. Waiting for admin to start.';
                case 'group':
                    return 'Groups Stage - Teams compete within their groups';
                case 'knockout':
                    return 'Knockout Stage - Semi-finals in progress';
                case 'final':
                    return 'Final Stage - Final and 3rd place matches';
                case 'completed':
                    return 'Tournament Completed - Final results available';
                default:
                    return 'Tournament in progress';
            }
        }
        else {
            switch (stage) {
                case 'not_yet_started':
                    return 'Tournament has not started yet. Waiting for admin to start.';
                case 'group':
                    return 'Round Robin - All teams play each other';
                case 'completed':
                    return 'Tournament Completed - Final results available';
                default:
                    return 'Tournament in progress';
            }
        }
    };
    const getFormatDescription = (format) => {
        switch (format) {
            case 'group_knockout':
                return 'Teams are divided into two groups. Top 2 teams from each group advance to knockout semi-finals, followed by final and 3rd place matches.';
            case 'round_robin':
                return 'All teams play against each other once. The team with the most points wins the tournament.';
            default:
                return 'Tournament format not specified.';
        }
    };
    if (!tournament) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(Trophy, { className: "mx-auto h-16 w-16 text-gray-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-600 mb-2", children: "No Tournament Selected" }), _jsx("p", { className: "text-gray-500", children: "Please create or select a tournament to view details." })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Trophy, { className: "h-8 w-8 mr-3" }), _jsx("h1", { className: "text-3xl font-bold", children: tournament.name })] }), tournament.description && (_jsx("p", { className: "text-blue-100 text-lg mb-4", children: tournament.description })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Start Date" }), _jsx("div", { children: formatDate(tournament.start_date) })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "End Date" }), _jsx("div", { children: formatDate(tournament.end_date) })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Venue" }), _jsx("div", { children: tournament.venue || 'TBD' })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Target, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Stage" }), _jsx("div", { className: "capitalize", children: tournament.stage === 'not_yet_started'
                                                    ? 'Yet to start'
                                                    : tournament.stage === 'completed'
                                                        ? 'Completed'
                                                        : `${tournament.stage.replace(/_/g, ' ')} - Round ${tournament.current_round}/${tournament.total_rounds}` })] })] })] })] }), tournament.stage === 'completed' && finalRankings && (_jsxs("div", { className: "bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Crown, { className: "h-8 w-8 mr-3 text-yellow-600" }), _jsx("h2", { className: "text-2xl font-bold text-yellow-800", children: "Tournament Champions" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: finalRankings.rankings.map((ranking, index) => (_jsxs("div", { className: `p-4 rounded-lg border-2 text-center ${index === 0 ? 'bg-yellow-300 border-yellow-500' :
                                index === 1 ? 'bg-gray-200 border-gray-400' :
                                    'bg-orange-200 border-orange-400'}`, children: [_jsx("div", { className: "text-3xl mb-2", children: index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }), _jsx("div", { className: "font-bold text-lg", children: ranking.team_name }), _jsx("div", { className: "text-sm font-medium", children: ranking.title })] }, ranking.position))) }), finalRankings.best_player && (_jsxs("div", { className: "bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(Crown, { className: "h-6 w-6 mr-2 text-purple-600" }), _jsx("h3", { className: "text-lg font-bold text-purple-800", children: "Best Player" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl mb-1", children: "\u2B50" }), _jsx("div", { className: "font-bold text-lg text-purple-900", children: finalRankings.best_player.name })] })] }))] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Info, { className: "h-6 w-6 mr-2 text-blue-600" }), _jsx("h2", { className: "text-xl font-semibold", children: "Tournament Information" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-2", children: "Format" }), _jsxs("p", { className: "text-sm text-gray-600 bg-gray-50 p-3 rounded", children: [_jsxs("strong", { children: [tournament.format === 'group_knockout' ? 'Group + Knockout' : 'Round Robin', ":"] }), " ", getFormatDescription(tournament.format)] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-2", children: "Current Stage" }), _jsxs("p", { className: "text-sm text-gray-600 bg-gray-50 p-3 rounded", children: [_jsxs("strong", { children: [tournament.stage === 'not_yet_started'
                                                                ? 'Yet to start'
                                                                : tournament.stage === 'completed'
                                                                    ? 'Completed'
                                                                    : tournament.stage.charAt(0).toUpperCase() + tournament.stage.slice(1), ":"] }), " ", getStageDescription(tournament.stage, tournament.format)] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-1", children: "Tournament ID" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["#", tournament.id] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-1", children: "Total Rounds" }), _jsx("p", { className: "text-sm text-gray-600", children: tournament.total_rounds })] })] })] })] }), isAdmin && (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Users, { className: "h-6 w-6 mr-2 text-green-600" }), _jsx("h2", { className: "text-xl font-semibold", children: "Tournament Administration" })] }), _jsxs("div", { className: "space-y-4", children: [tournament.stage === 'not_yet_started' && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded p-4", children: [_jsx("h3", { className: "font-semibold text-yellow-800 mb-2", children: "Start Tournament" }), _jsx("button", { onClick: handleStartTournament, disabled: isAdvancing, className: "w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mb-2", children: isAdvancing ? 'Starting...' : 'Start Tournament' }), _jsx("p", { className: "text-sm text-yellow-700", children: "Click to begin the tournament. Teams and players cannot be edited after starting." })] })), tournament.format === 'group_knockout' && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-4", children: [_jsx("h3", { className: "font-semibold text-blue-800 mb-2", children: "Stage Progression" }), tournament.stage === 'group' && (_jsx("p", { className: "text-sm text-blue-700", children: "Complete all group stage rounds to automatically advance to semi-finals." })), tournament.stage === 'semifinal' && (_jsx("p", { className: "text-sm text-blue-700", children: "Complete all semi-final rounds to automatically advance to finals." })), tournament.stage === 'final' && (_jsx("div", { children: canComplete ? (_jsxs("div", { children: [_jsx("button", { onClick: handleCompleteTournament, disabled: isAdvancing, className: "w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-2", children: isAdvancing ? 'Completing...' : 'Complete Tournament' }), _jsx("p", { className: "text-sm text-blue-700", children: "Final and 3rd place matches are completed. Click to finalize tournament results." })] })) : (_jsx("p", { className: "text-sm text-blue-700", children: "Complete final and 3rd place matches to finish the tournament." })) })), tournament.stage === 'completed' && (_jsx("div", { className: "bg-green-100 border border-green-300 rounded p-3", children: _jsx("p", { className: "text-green-800 text-sm font-medium", children: "\u2705 Tournament completed! Final rankings are displayed above." }) }))] })), tournament.stage === 'completed' && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-300 rounded p-4", children: [_jsx("h3", { className: "font-semibold text-yellow-800 mb-2", children: "Tournament Locked" }), _jsxs("div", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("p", { children: "\u2022 Player swapping is disabled" }), _jsx("p", { children: "\u2022 Match results cannot be edited" }), _jsx("p", { children: "\u2022 Tournament progression is complete" })] })] })), tournament.stage !== 'completed' && (_jsxs("div", { className: "bg-gray-50 border border-gray-300 rounded p-4", children: [_jsx("h3", { className: "font-semibold text-gray-800 mb-2", children: "Available Actions" }), _jsxs("div", { className: "text-sm text-gray-700 space-y-1", children: [_jsx("p", { children: "\u2022 Edit match results in Schedule tab" }), _jsx("p", { children: "\u2022 Swap players before matches are completed" }), _jsx("p", { children: "\u2022 Monitor tournament progress in Standings tab" })] })] }))] })] }))] })] }));
};
export default TournamentHome;
