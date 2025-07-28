import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Tournament } from '@/types';
import { Trophy, Calendar, MapPin, Info, Target, Crown } from 'lucide-react';
import { getProgressDisplay, getStageDisplayText } from '@/utils/helpers';

interface TournamentHomeProps {
  tournament?: Tournament | null;
  isAdmin: boolean;
  onUpdate: () => void;
}

const TournamentHome: React.FC<TournamentHomeProps> = ({ tournament, isAdmin, onUpdate }) => {
  const [canComplete, setCanComplete] = useState(false);
  const [finalRankings, setFinalRankings] = useState<any>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [groupStandings, setGroupStandings] = useState<{ group_a: any[], group_b: any[] }>({ group_a: [], group_b: [] });
  const [announcement, setAnnouncement] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!tournament) return;

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
        } catch (error) {
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
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadAdminData();
  }, [tournament, isAdmin]);

  const handleCompleteTournament = async () => {
    if (!tournament || !canComplete) return;
    
    setIsAdvancing(true);
    try {
      await apiService.completeTournament(tournament.id);
      onUpdate();
      setCanComplete(false);
      
      // Get final rankings
      const rankings = await apiService.getFinalRankings(tournament.id);
      setFinalRankings(rankings);
    } catch (error) {
      console.error('Error completing tournament:', error);
      alert('Failed to complete tournament');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleStartTournament = async () => {
    if (!tournament) return;
    
    setIsAdvancing(true);
    try {
      await apiService.startTournament(tournament.id);
      onUpdate(); // Refresh tournament data
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert('Failed to start tournament. Make sure you have at least 2 teams.');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!tournament) return;
    
    setIsSavingAnnouncement(true);
    try {
      // Try API first, fallback to localStorage
      try {
        await apiService.updateTournamentAnnouncement(tournament.id, announcement);
      } catch (error) {
        // Fallback to localStorage if API is not available
        localStorage.setItem(`tournament_${tournament.id}_announcement`, announcement);
      }
      
      setCurrentAnnouncement(announcement);
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement. Please try again.');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageDescription = (stage: string, format?: string) => {
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
    } else {
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

  const getFormatDescription = (format?: string) => {
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Tournament Selected</h2>
          <p className="text-gray-500">Please create or select a tournament to view details.</p>
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
          
          {/* Start Tournament Button in Header */}
          {isAdmin && tournament.stage === 'not_yet_started' && (
            <button
              onClick={handleStartTournament}
              disabled={isAdvancing}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold shadow-lg transition-colors duration-200"
            >
              {isAdvancing ? 'Starting...' : 'Start Tournament'}
            </button>
          )}
        </div>
        
        {tournament.description && (
          <p className="text-blue-100 text-lg mb-4">{tournament.description}</p>
        )}
        
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

      {/* Announcement Display for All Users */}
      {currentAnnouncement && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-blue-800">Tournament Announcement</h2>
          </div>
          
          <div className="bg-white border border-blue-100 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{currentAnnouncement}</p>
          </div>
        </div>
      )}

      {/* Admin Announcements */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 mr-2 text-amber-600" />
            <h2 className="text-xl font-semibold text-amber-800">Admin Announcements</h2>
          </div>
          
          <div className="space-y-4">
            <textarea
              placeholder="Add tournament announcements, important notes, or updates for participants..."
              className="w-full p-4 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              rows={4}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
            />
            
            <div className="flex justify-end">
              <button 
                onClick={handleSaveAnnouncement}
                disabled={isSavingAnnouncement}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium transition-colors duration-200"
              >
                {isSavingAnnouncement ? 'Saving...' : 'Save Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        {/* Tournament Information */}
        <div className="bg-white p-6 rounded-lg shadow max-w-2xl w-full">
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">Tournament Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Format</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <strong>{tournament.format === 'group_knockout' ? 'Group + Knockout' : 'Round Robin'}:</strong> {getFormatDescription(tournament.format)}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Total Rounds</h3>
              <p className="text-sm text-gray-600">{tournament.total_rounds}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHome;
