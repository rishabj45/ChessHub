import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, Trophy, FileText } from 'lucide-react';
import { apiService } from '@/services/api';
import { Tournament, TournamentUpdate } from '@/types';

interface TournamentEditModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const TournamentEditModal: React.FC<TournamentEditModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState<TournamentUpdate>({
    name: '',
    description: '',
    venue: '',
    start_date: '',
    end_date: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tournament) {
      // Format dates for input fields (ISO format for date inputs)
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
      };

      setFormData({
        name: tournament.name || '',
        description: tournament.description || '',
        venue: tournament.venue || '',
        start_date: formatDateForInput(tournament.start_date),
        end_date: formatDateForInput(tournament.end_date)
      });
      setError(null);
    }
  }, [isOpen, tournament]);

  const handleInputChange = (field: keyof TournamentUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.name?.trim()) {
      return 'Tournament name is required';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate > endDate) {
        return 'Start date cannot be after end date';
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

    setIsLoading(true);
    setError(null);

    try {
      // Only send fields that have changed
      const updateData: TournamentUpdate = {};
      
      if (formData.name !== tournament.name) {
        updateData.name = formData.name;
      }
      if (formData.description !== tournament.description) {
        updateData.description = formData.description;
      }
      if (formData.venue !== tournament.venue) {
        updateData.venue = formData.venue;
      }
      
      // Handle date fields with proper conversion
      const currentStartDate = tournament.start_date ? new Date(tournament.start_date).toISOString().split('T')[0] : '';
      const currentEndDate = tournament.end_date ? new Date(tournament.end_date).toISOString().split('T')[0] : '';
      
      if (formData.start_date !== currentStartDate) {
        updateData.start_date = formData.start_date ? new Date(formData.start_date).toISOString() : null;
      }
      if (formData.end_date !== currentEndDate) {
        updateData.end_date = formData.end_date ? new Date(formData.end_date).toISOString() : null;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        await apiService.updateTournament(tournament.id, updateData);
        onUpdate();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error updating tournament:', err);
      setError(err.response?.data?.detail || 'Failed to update tournament');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Edit Tournament</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Tournament Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Trophy className="h-4 w-4 inline mr-1" />
              Tournament Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tournament name"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tournament description"
              disabled={isLoading}
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Venue
            </label>
            <input
              type="text"
              value={formData.venue || ''}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter venue location"
              disabled={isLoading}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 border border-transparent rounded-md transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentEditModal;
