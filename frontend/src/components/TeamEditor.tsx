import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Player, Team } from '@/types';
import { apiService } from '@/services/api';

interface TeamEditorProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
  isAdmin: boolean;
  tournamentStage?: string;
}

const TeamEditor: React.FC<TeamEditorProps> = ({ team, isOpen, onClose, onSave, isAdmin, tournamentStage }) => {
  const [name, setName] = useState(team.name);
  const [players, setPlayers] = useState<Player[]>([]);
  const [originalPlayers, setOriginalPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditingDisabled = tournamentStage && tournamentStage !== 'not_yet_started';

  useEffect(() => {
    if (isOpen && team.id) {
      loadTeamPlayers();
    }
  }, [isOpen, team.id]);

  useEffect(() => {
    setName(team.name);
    setError(null);
  }, [team]);

  const loadTeamPlayers = async () => {
    try {
      setIsLoading(true);
      const teamPlayers = await apiService.getPlayers(team.id);
      setPlayers(teamPlayers);
      setOriginalPlayers([...teamPlayers]);
    } catch (err: any) {
      setError('Failed to load team players');
      console.error('Error loading players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('Player name is required');
      return;
    }

    if (players.length >= 6) {
      setError('Maximum 6 players allowed per team');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const newPlayer = {
        name: newPlayerName.trim(),
        team_id: team.id,
        rating: typeof newPlayerRating === 'number' ? newPlayerRating : undefined,
      };

      const createdPlayer = await apiService.createPlayer(newPlayer);
      setPlayers(prev => [...prev, createdPlayer]);
      setNewPlayerName('');
      setNewPlayerRating('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add player');
      console.error('Error adding player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removePlayer = async (playerIndex: number) => {
    const player = players[playerIndex];
    if (!player.id) return;

    if (players.length <= 4) {
      setError('Minimum 4 players required per team');
      return;
    }

    if (!confirm(`Are you sure you want to delete player "${player.name}"?`)) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await apiService.deletePlayer(player.id);
      setPlayers(prev => prev.filter((_, i) => i !== playerIndex));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete player');
      console.error('Error deleting player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayerName = (index: number, newName: string) => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  };

  const updatePlayerRating = (index: number, newRating: string) => {
    setPlayers(prev => {
      const updated = [...prev];
      const rating = newRating === '' ? 1200 : parseInt(newRating) || 1200;
      updated[index] = { ...updated[index], rating };
      return updated;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const playerUpdates = players
        .filter(player => {
          const original = originalPlayers.find(op => op.id === player.id);
          return original && (
            player.name !== original.name || 
            player.rating !== original.rating
          );
        })
        .map(player => 
          apiService.updatePlayer(player.id!, {
            name: player.name,
            rating: player.rating
          })
        );

      await Promise.all(playerUpdates);

      const updatedTeam: Team = {
        ...team,
        name: name.trim(),
      };

      onSave(updatedTeam);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save changes');
      console.error('Error saving team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(team.name);
    setPlayers([]);
    setOriginalPlayers([]);
    setNewPlayerName('');
    setNewPlayerRating('');
    setError(null);
    onClose();
  };

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit Team</h3>
            <button 
              onClick={handleClose}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Tournament Started Alert */}
          {isEditingDisabled && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
              <strong>Tournament has started</strong> - Teams and players cannot be edited.
            </div>
          )}

          {/* Team Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isLoading || isEditingDisabled}
              placeholder="Enter team name"
            />
          </div>

          {/* Players Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Players ({players.length}/6)
            </label>
            
            {/* Existing Players */}
            <div className="space-y-3 mb-4">
              {players.map((player, index) => (
                <div key={player.id || index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <input
                    className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    value={player.name}
                    onChange={e => updatePlayerName(index, e.target.value)}
                    disabled={isLoading || isEditingDisabled}
                    placeholder="Player name"
                  />
                  <input
                    type="number"
                    className="w-20 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    value={player.rating || ''}
                    onChange={e => updatePlayerRating(index, e.target.value)}
                    disabled={isLoading || isEditingDisabled}
                    placeholder="Rating"
                    min="0"
                    max="3000"
                  />
                  <button
                    onClick={() => removePlayer(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    disabled={isLoading || players.length <= 4 || isEditingDisabled}
                    title={players.length <= 4 ? "Minimum 4 players required" : "Remove player"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Player */}
            {!isEditingDisabled && players.length < 6 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Player</h4>
                <div className="flex items-center space-x-3">
                  <input
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Player name"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    disabled={isLoading}
                    onKeyPress={e => e.key === 'Enter' && newPlayerName.trim() && addPlayer()}
                  />
                  <input
                    type="number"
                    className="w-20 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rating"
                    value={newPlayerRating}
                    onChange={e => setNewPlayerRating(e.target.value === '' ? '' : parseInt(e.target.value))}
                    disabled={isLoading}
                    min="0"
                    max="3000"
                    onKeyPress={e => e.key === 'Enter' && newPlayerName.trim() && addPlayer()}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    onClick={addPlayer}
                    disabled={!newPlayerName.trim() || isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
          <button 
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            onClick={save}
            disabled={!name.trim() || isLoading || isEditingDisabled}
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamEditor;
