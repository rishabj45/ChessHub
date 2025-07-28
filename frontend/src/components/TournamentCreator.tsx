import React, { useState } from 'react';
import { Plus, Minus, Calendar, Trophy, Users, Info } from 'lucide-react';
import { apiService } from '@/services/api';
import { TournamentFormat } from '@/types';

interface TournamentCreatorProps {
  isAdmin: boolean;
  onTournamentCreated: () => void;
}

interface TeamSetup {
  name: string;
  playerCount: number;
}

interface TournamentFormData {
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  format: TournamentFormat;
  teams: TeamSetup[];
}

const TournamentCreator: React.FC<TournamentCreatorProps> = ({ isAdmin, onTournamentCreated }) => {
  const [formData, setFormData] = useState<TournamentFormData>({
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof Omit<TournamentFormData, 'teams'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleTeamChange = (index: number, field: keyof TeamSetup, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === index ? { ...team, [field]: value } : team
      ),
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

  const removeTeam = (index: number) => {
    if (formData.teams.length <= 2) {
      setError('Minimum 2 teams required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Tournament name is required';
    if (formData.teams.length < 2) return 'At least 2 teams are required';
    
    for (let i = 0; i < formData.teams.length; i++) {
      const team = formData.teams[i];
      if (!team.name.trim()) return `Team ${i + 1} name is required`;
      if (team.playerCount < 1 || team.playerCount > 8) return `Team ${i + 1} must have 1-8 players`;
    }

    // Check for duplicate team names
    const teamNames = formData.teams.map(t => t.name.trim().toLowerCase());
    const uniqueNames = new Set(teamNames);
    if (teamNames.length !== uniqueNames.size) return 'Team names must be unique';

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
    if (numTeams < 2) return 0;
    
    if (formData.format === 'round_robin') {
      // Round-robin: each team plays every other team once
      // For odd number of teams, we need n rounds
      // For even number of teams, we need n-1 rounds
      return numTeams % 2 === 0 ? numTeams - 1 : numTeams;
    } else if (formData.format === 'group_knockout') {
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
    if (numTeams < 2) return 0;
    
    if (formData.format === 'round_robin') {
      // Total matches in round-robin = n * (n-1) / 2
      return (numTeams * (numTeams - 1)) / 2;
    } else if (formData.format === 'group_knockout') {
      // Group stage matches + knockout matches
      const teamsPerGroup = Math.floor(numTeams / 2);
      const groupMatches = 2 * (teamsPerGroup * (teamsPerGroup - 1)) / 2; // 2 groups
      const knockoutMatches = 4; // 2 semi-finals + final + 3rd place (final & 3rd in same round)
      return groupMatches + knockoutMatches;
    }
    
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      } catch (setCurrentError: any) {
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
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      setError(err.response?.data?.detail || 'Failed to create tournament');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Admin Access Required</h2>
          <p className="text-gray-500">You need admin privileges to create tournaments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Trophy className="text-yellow-500 text-2xl" />
          <h1 className="text-2xl font-bold text-gray-800">Create New Tournament</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tournament name"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tournament description (optional)"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tournament venue (optional)"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tournament Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Trophy className="inline w-4 h-4 mr-1" />
              Tournament Format *
            </label>
            <select
              value={formData.format}
              onChange={(e) => handleInputChange('format', e.target.value as TournamentFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="round_robin">Round Robin - All teams play each other</option>
              <option value="group_knockout">Group + Knockout - Teams split into groups, top 2 advance to knockout</option>
            </select>
          </div>

          {/* Tournament Statistics */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" />
              Tournament Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formData.teams.length}</div>
                <div className="text-gray-600">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{calculateRounds()}</div>
                <div className="text-gray-600">Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{calculateMatches()}</div>
                <div className="text-gray-600">Total Matches</div>
              </div>
            </div>
          </div>

          {/* Teams Setup */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Teams Setup
              </h3>
              <button
                type="button"
                onClick={addTeam}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                <span>Add Team</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.teams.map((team, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => handleTeamChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Team ${index + 1} name`}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={team.playerCount}
                      onChange={(e) => handleTeamChange(index, 'playerCount', parseInt(e.target.value) || 4)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTeam(index)}
                    className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                    disabled={isLoading || formData.teams.length <= 2}
                    title="Remove team"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Tournament...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>Create Tournament</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentCreator;
