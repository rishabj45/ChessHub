import React, { useState } from 'react';
import { Calendar, Trophy, Users } from 'lucide-react';
import { apiService } from '@/services/api';
import { TournamentFormat } from '@/types';

interface TournamentCreatorProps {
  isAdmin: boolean;
  onTournamentCreated: () => void;
}

interface TournamentFormData {
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  format: TournamentFormat;
  numberOfTeams: number;
}

const TournamentCreator: React.FC<TournamentCreatorProps> = ({ isAdmin, onTournamentCreated }) => {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    format: 'round_robin',
    numberOfTeams: 4,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof TournamentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const generateTeamNames = (count: number): string[] => {
    return Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Tournament name is required';
    if (formData.numberOfTeams < 2) return 'At least 2 teams are required';
    if (formData.numberOfTeams > 32) return 'Maximum 32 teams allowed';

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      return 'End date must be after start date';
    }

    // Format-specific validation
    if (formData.format === 'group_knockout') {
      if (formData.numberOfTeams < 4) {
        return 'Group + Knockout format requires at least 4 teams';
      }
      if (formData.numberOfTeams % 2 !== 0) {
        return 'Group + Knockout format requires an even number of teams';
      }
    }

    return null;
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
      const teamNames = generateTeamNames(formData.numberOfTeams);

      const tournamentData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        venue: formData.venue.trim() || null,
        start_date: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        team_names: teamNames,
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
        numberOfTeams: 4,
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
                type="date"
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
                type="date"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Teams *
                </label>
                <input
                  type="number"
                  min="2"
                  max="32"
                  value={formData.numberOfTeams}
                  onChange={(e) => handleInputChange('numberOfTeams', parseInt(e.target.value) || 2)}
                  className="w-20 text-center px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
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
