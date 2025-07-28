import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Trophy, Calendar, MapPin, Info, Target, Crown } from 'lucide-react';
import { getStageDisplayText } from '@/utils/helpers';
const TournamentHome = ({ tournament, isAdmin, onUpdate }) => {
    const [canComplete, setCanComplete] = useState(false);
    const [finalRankings, setFinalRankings] = useState(null);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [groupStandings, setGroupStandings] = useState({ group_a: [], group_b: [] });
    const [announcement, setAnnouncement] = useState('');
    const [currentAnnouncement, setCurrentAnnouncement] = useState('');
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    useEffect(() => {
        const loadAdminData = async () => {
            if (!tournament)
                return;
            try {
                // Try to load announcement from API, fallback to localStorage
                try {
                    const announcementData = await apiService.getTournamentAnnouncement(tournament.id);
                    if (announcementData.announcement) {
                        setCurrentAnnouncement(announcementData.announcement);
                        if (isAdmin) {
                            setAnnouncement(announcementData.announcement);
                        }
                    }
                }
                catch (error) {
                    // Fallback to localStorage if API is not available
                    const savedAnnouncement = localStorage.getItem(`tournament_${tournament.id}_announcement`);
                    if (savedAnnouncement) {
                        setCurrentAnnouncement(savedAnnouncement);
                        if (isAdmin) {
                            setAnnouncement(savedAnnouncement);
                        }
                    }
                }
                // Admin-only data loading
                if (isAdmin) {
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
            }
            catch (error) {
                console.error('Error loading data:', error);
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
    const handleSaveAnnouncement = async () => {
        if (!tournament)
            return;
        setIsSavingAnnouncement(true);
        try {
            // Try API first, fallback to localStorage
            try {
                await apiService.updateTournamentAnnouncement(tournament.id, announcement);
            }
            catch (error) {
                // Fallback to localStorage if API is not available
                localStorage.setItem(`tournament_${tournament.id}_announcement`, announcement);
            }
            setCurrentAnnouncement(announcement);
        }
        catch (error) {
            console.error('Error saving announcement:', error);
            alert('Failed to save announcement. Please try again.');
        }
        finally {
            setIsSavingAnnouncement(false);
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Trophy, { className: "h-8 w-8 mr-3" }), _jsx("h1", { className: "text-3xl font-bold", children: tournament.name })] }), isAdmin && tournament.stage === 'not_yet_started' && (_jsx("button", { onClick: handleStartTournament, disabled: isAdvancing, className: "px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold shadow-lg transition-colors duration-200", children: isAdvancing ? 'Starting...' : 'Start Tournament' }))] }), tournament.description && (_jsx("p", { className: "text-blue-100 text-lg mb-4", children: tournament.description })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Start Date" }), _jsx("div", { children: formatDate(tournament.start_date) })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "End Date" }), _jsx("div", { children: formatDate(tournament.end_date) })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Venue" }), _jsx("div", { children: tournament.venue || 'TBD' })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Target, { className: "h-5 w-5 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Stage" }), _jsx("div", { className: "capitalize", children: getStageDisplayText(tournament) })] })] })] })] }), tournament.stage === 'completed' && finalRankings && (_jsxs("div", { className: "bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Crown, { className: "h-8 w-8 mr-3 text-yellow-600" }), _jsx("h2", { className: "text-2xl font-bold text-yellow-800", children: "Tournament Champions" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: finalRankings.rankings.map((ranking, index) => (_jsxs("div", { className: `p-4 rounded-lg border-2 text-center ${index === 0 ? 'bg-yellow-300 border-yellow-500' :
                                index === 1 ? 'bg-gray-200 border-gray-400' :
                                    'bg-orange-200 border-orange-400'}`, children: [_jsx("div", { className: "text-3xl mb-2", children: index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }), _jsx("div", { className: "font-bold text-lg", children: ranking.team_name }), _jsx("div", { className: "text-sm font-medium", children: ranking.title })] }, ranking.position))) }), finalRankings.best_player && (_jsxs("div", { className: "bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(Crown, { className: "h-6 w-6 mr-2 text-purple-600" }), _jsx("h3", { className: "text-lg font-bold text-purple-800", children: "Best Player" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl mb-1", children: "\u2B50" }), _jsx("div", { className: "font-bold text-lg text-purple-900", children: finalRankings.best_player.name })] })] }))] })), currentAnnouncement && (_jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-lg", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Info, { className: "h-6 w-6 mr-2 text-blue-600" }), _jsx("h2", { className: "text-xl font-semibold text-blue-800", children: "Tournament Announcement" })] }), _jsx("div", { className: "bg-white border border-blue-100 rounded-lg p-4", children: _jsx("p", { className: "text-gray-700 whitespace-pre-wrap", children: currentAnnouncement }) })] })), isAdmin && (_jsxs("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 shadow-lg", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Info, { className: "h-6 w-6 mr-2 text-amber-600" }), _jsx("h2", { className: "text-xl font-semibold text-amber-800", children: "Admin Announcements" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("textarea", { placeholder: "Add tournament announcements, important notes, or updates for participants...", className: "w-full p-4 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none", rows: 4, value: announcement, onChange: (e) => setAnnouncement(e.target.value) }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: handleSaveAnnouncement, disabled: isSavingAnnouncement, className: "px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium transition-colors duration-200", children: isSavingAnnouncement ? 'Saving...' : 'Save Announcement' }) })] })] })), _jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow max-w-2xl w-full", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Info, { className: "h-6 w-6 mr-2 text-blue-600" }), _jsx("h2", { className: "text-xl font-semibold", children: "Tournament Information" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-2", children: "Format" }), _jsxs("p", { className: "text-sm text-gray-600 bg-gray-50 p-3 rounded", children: [_jsxs("strong", { children: [tournament.format === 'group_knockout' ? 'Group + Knockout' : 'Round Robin', ":"] }), " ", getFormatDescription(tournament.format)] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-1", children: "Total Rounds" }), _jsx("p", { className: "text-sm text-gray-600", children: tournament.total_rounds })] })] })] }) })] }));
};
export default TournamentHome;
