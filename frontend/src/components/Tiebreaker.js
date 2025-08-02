import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { apiService } from '@/services/api';
const Tiebreaker = ({ tiebreaker, whiteTeamName, blackTeamName, isAdmin, onTiebreakerComplete }) => {
    const [selectedWinner, setSelectedWinner] = useState(tiebreaker.winner_team_id || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSelectWinner = async (teamId) => {
        if (!isAdmin || tiebreaker.is_completed)
            return;
        // Check if clicking the same team again (toggle off)
        const currentWinner = selectedWinner || tiebreaker.winner_team_id;
        const isToggleOff = currentWinner === teamId;
        // Optimistically update the UI
        setSelectedWinner(isToggleOff ? null : teamId);
        setIsSubmitting(true);
        try {
            await apiService.selectTiebreakerWinner(tiebreaker.id, teamId);
            onTiebreakerComplete();
        }
        catch (error) {
            console.error('Failed to select tiebreaker winner:', error);
            alert('Failed to select tiebreaker winner');
            // Revert the optimistic update on error
            setSelectedWinner(tiebreaker.winner_team_id || null);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const getWinnerTeamName = () => {
        if (!selectedWinner && !tiebreaker.winner_team_id)
            return null;
        const winnerId = selectedWinner || tiebreaker.winner_team_id;
        return winnerId === tiebreaker.white_team_id
            ? whiteTeamName
            : blackTeamName;
    };
    // Show current selection or final result
    // Only show as completed if the tiebreaker is actually marked as completed (when round is done)
    const showAsCompleted = tiebreaker.is_completed;
    const hasSelection = selectedWinner !== null || tiebreaker.winner_team_id !== null;
    return (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3", children: [_jsx("div", { className: "flex items-center mb-3", children: _jsx("span", { className: "font-semibold text-yellow-800", children: "\u2694\uFE0F Tiebreaker " }) }), showAsCompleted ? (_jsxs("div", { className: "text-green-700 font-medium", children: ["\uD83C\uDFC6 Winner: ", _jsx("strong", { children: getWinnerTeamName() })] })) : (_jsx("div", { className: "space-y-2", children: isAdmin ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm text-gray-700 mb-3", children: "Select Armageddon winner (click again to deselect):" }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => handleSelectWinner(tiebreaker.white_team_id), disabled: isSubmitting, className: `px-4 py-2 rounded border font-medium transition-all ${selectedWinner === tiebreaker.white_team_id
                                        ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`, children: [whiteTeamName, selectedWinner === tiebreaker.white_team_id && (_jsx("span", { className: "ml-2", children: "\u2713" }))] }), _jsxs("button", { onClick: () => handleSelectWinner(tiebreaker.black_team_id), disabled: isSubmitting, className: `px-4 py-2 rounded border font-medium transition-all ${selectedWinner === tiebreaker.black_team_id
                                        ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-300'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`, children: [blackTeamName, selectedWinner === tiebreaker.black_team_id && (_jsx("span", { className: "ml-2", children: "\u2713" }))] })] }), hasSelection && (_jsx("p", { className: "text-sm text-blue-600 mt-2", children: "\uD83D\uDCA1 Click the selected team again to deselect" }))] })) : (
                // Viewer mode - simple status
                _jsx("div", { children: hasSelection ? (_jsxs("div", { className: "text-blue-700 font-medium", children: ["\uD83C\uDFC6 Winner: ", _jsx("strong", { children: getWinnerTeamName() })] })) : (_jsx("p", { className: "text-gray-600", children: "Awaiting winner" })) })) }))] }));
};
export default Tiebreaker;
