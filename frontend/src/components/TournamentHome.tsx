import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Tournament } from '@/types';
import { Trophy, Calendar, MapPin,Target, Crown, Edit } from 'lucide-react';
import {  getStageDisplayText } from '@/utils/helpers';
import AnnouncementManager from './AnnouncementManager';
import TournamentEditModal from './TournamentEditModal';

interface TournamentHomeProps {
  tournament?: Tournament | null;
  isAdmin: boolean;
  onUpdate: () => void;
}

const TournamentHome: React.FC<TournamentHomeProps> = ({ tournament, isAdmin, onUpdate }) => {
  const [finalRankings, setFinalRankings] = useState<any>(null);
  const [groupStandings, setGroupStandings] = useState<{ group_a: any[], group_b: any[] }>({ group_a: [], group_b: [] });
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const loadFinalRankings = async () => {
      if (!tournament || tournament.stage !== 'completed') return;

      try {
        // Get best player (always from best-players endpoint, already sorted)
        const bestPlayersData = await apiService.getBestPlayers(tournament.id);
        const bestPlayer = bestPlayersData.players.length > 0 ? bestPlayersData.players[0] : null;

        let rankings = [];

        if (tournament.format === 'round_robin') {
          // For round robin: simply get top 3 from standings (already sorted)
          const standingsData = await apiService.getStandings(tournament.id);
          rankings = standingsData.standings.slice(0, 3).map((standing: any, index: number) => ({
            position: index + 1,
            team_name: standing.team_name,
            title: index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : '3rd Place'
          }));
        } else if (tournament.format === 'group_knockout') {
          // For group_knockout: get results from final and 3rd place matches
          try {
            // Get teams data for name lookups and final round matches
            const [teamsData, finalMatches] = await Promise.all([
              apiService.getTeams(tournament.id),
              apiService.getMatches(tournament.id, tournament.total_rounds)
            ]);
            
            // Find Final and 3rd Place matches
            const finalMatch = finalMatches.find((match: any) => match.label === 'Final');
            const thirdPlaceMatch = finalMatches.find((match: any) => match.label === '3rd Place');
            
            if (finalMatch && thirdPlaceMatch) {
              // Helper function to get team name by ID
              const getTeamName = (teamId: number) => {
                return teamsData.find(team => team.id === teamId)?.name || `Team ${teamId}`;
              };

              // Determine winners and losers
              const finalWinner = finalMatch.result === 'white_win' ? getTeamName(finalMatch.white_team_id!) : 
                                finalMatch.result === 'black_win' ? getTeamName(finalMatch.black_team_id!) : null;
              const finalLoser = finalMatch.result === 'white_win' ? getTeamName(finalMatch.black_team_id!) : 
                               finalMatch.result === 'black_win' ? getTeamName(finalMatch.white_team_id!) : null;
              const thirdPlaceWinner = thirdPlaceMatch.result === 'white_win' ? getTeamName(thirdPlaceMatch.white_team_id!) : 
                                     thirdPlaceMatch.result === 'black_win' ? getTeamName(thirdPlaceMatch.black_team_id!) : null;

              if (finalWinner && finalLoser && thirdPlaceWinner) {
                rankings = [
                  { position: 1, team_name: finalWinner, title: 'Champion' },
                  { position: 2, team_name: finalLoser, title: 'Runner-up' },
                  { position: 3, team_name: thirdPlaceWinner, title: '3rd Place' }
                ];
              }
            }
          } catch (error) {
            console.error('Error getting final matches:', error);
            // Fallback to standings if final matches not available
            const standingsData = await apiService.getStandings(tournament.id);
            rankings = standingsData.standings.slice(0, 3).map((standing: any, index: number) => ({
              position: index + 1,
              team_name: standing.team_name,
              title: index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : '3rd Place'
            }));
          }
        }

        setFinalRankings({
          rankings,
          best_player: bestPlayer ? { name: bestPlayer.player_name } : null
        });

      } catch (error) {
        console.error('Error loading final rankings:', error);
      }
    };

    const loadAdminData = async () => {
      if (!tournament) return;

      try {
        // Admin-only data loading for group standings
        if (isAdmin && tournament.format === 'group_knockout') {
          const standingsData = await apiService.getStandings(tournament.id);
          // Group standings by group number for group_knockout format
          const groupA = standingsData.standings.filter((s: any) => s.group === 1);
          const groupB = standingsData.standings.filter((s: any) => s.group === 2);
          setGroupStandings({ group_a: groupA, group_b: groupB });
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadFinalRankings();
    loadAdminData();
  }, [tournament, isAdmin]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFormatDescription = (format?: string) => {
    switch (format) {
      case 'group_knockout':
        return 'Teams are divided into two groups. Top 2 teams from each group advance to semi-finals, followed by final and 3rd place matches.';
      case 'round_robin':
        return 'All teams play against each other once. The team with the most points wins the tournament.';
      default:
        return 'Tournament format not specified.';
    }
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tournament</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 mr-3" />
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
          </div>
          
          {/* Edit Icon - Only show for admins */}
          {isAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Edit Tournament Details"
            >
              <Edit className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          )}
        </div>
        
        {tournament.description && (
          <p className="text-blue-100 text-lg mb-4">{tournament.description}</p>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <div>
                <div className="font-semibold">Start Date</div>
                <div>{formatDate(tournament.start_date)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <div>
                <div className="font-semibold">End Date</div>
                <div>{formatDate(tournament.end_date)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              <div>
                <div className="font-semibold">Venue</div>
                <div>{tournament.venue || 'TBD'}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              <div>
                <div className="font-semibold">Stage</div>
                <div className="capitalize">
                  {getStageDisplayText(tournament)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Format Information */}
          <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-300">
            <div className="flex items-center mb-2">
              <Trophy className="h-5 w-5 mr-2" />
              <h3 className="font-semibold text-blue-100">Tournament Format</h3>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-blue-100 mb-1">
                {tournament.format === 'group_knockout' ? 'Group + Knockout' : 'Round Robin'}
              </div>
              <p className="text-blue-50 leading-relaxed">
                {getFormatDescription(tournament.format)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final Rankings Display (if completed) */}
      {tournament.stage === 'completed' && finalRankings && (
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Crown className="h-8 w-8 mr-3 text-yellow-600" />
            <h2 className="text-2xl font-bold text-yellow-800">Tournament Champions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {finalRankings.rankings.map((ranking: any, index: number) => (
              <div 
                key={ranking.position} 
                className={`p-4 rounded-lg border-2 text-center ${
                  index === 0 ? 'bg-yellow-300 border-yellow-500' :
                  index === 1 ? 'bg-gray-200 border-gray-400' :
                  'bg-orange-200 border-orange-400'
                }`}
              >
                <div className="text-3xl mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="font-bold text-lg">{ranking.team_name}</div>
                <div className="text-sm font-medium">{ranking.title}</div>
              </div>
            ))}
          </div>
          
          {/* Best Player Display */}
          {finalRankings.best_player && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 mr-2 text-purple-600" />
                <h3 className="text-lg font-bold text-purple-800">Best Player</h3>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⭐</div>
                <div className="font-bold text-lg text-purple-900">{finalRankings.best_player.name}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Announcements System */}
      <AnnouncementManager 
        tournamentId={tournament.id}
        isAdmin={isAdmin}
        onUpdate={onUpdate}
      />

      {/* Tournament Edit Modal */}
      {isAdmin && tournament && (
        <TournamentEditModal
          tournament={tournament}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default TournamentHome;
