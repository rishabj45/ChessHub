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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-2 flex-shrink-0">
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

        {/* Content - Two Column Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Column - Team Name and Add Player */}
          <div className="w-1/3 p-3 border-r border-gray-200 flex flex-col space-y-3">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Tournament Started Alert */}
            {isEditingDisabled && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                <strong>Tournament Started</strong><br />Cannot edit teams/players.
              </div>
            )}

            {/* Team Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              <input
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLoading || isEditingDisabled}
                placeholder="Enter team name"
              />
            </div>
          </div>

          {/* Right Column - Players Grid */}
          <div className="flex-1 p-3 flex flex-col min-h-0">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Players ({players.length}/6)</h4>
            
            {/* Compact Players Grid */}
            <div className="grid grid-cols-1 gap-1 flex-1 content-start">
              {Array.from({ length: 6 }, (_, index) => {
                const player = players[index];
                return (
                  <div key={index} className={`border rounded-lg p-2 min-h-[2.5rem] transition-colors ${
                    player 
                      ? 'bg-white border-gray-300' 
                      : 'bg-gray-50 border-dashed border-gray-300'
                  }`}>
                    {player ? (
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                          <input
                            className="flex-1 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                            value={player.name}
                            onChange={e => updatePlayerName(index, e.target.value)}
                            disabled={isLoading || isEditingDisabled}
                            placeholder="Player name"
                          />
                          <input
                            type="number"
                            className="w-16 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                            value={player.rating || ''}
                            onChange={e => updatePlayerRating(index, e.target.value)}
                            disabled={isLoading || isEditingDisabled}
                            placeholder="Rating"
                            min="0"
                            max="3000"
                          />
                          <button
                            onClick={() => removePlayer(index)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                            disabled={isLoading || players.length <= 4 || isEditingDisabled}
                            title={
                              isEditingDisabled 
                                ? "Cannot edit after tournament starts"
                                : players.length <= 4 
                                  ? "Minimum 4 players required" 
                                  : "Remove player"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        !isEditingDisabled && players.length < 6 && index === players.length ? (
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                              <Plus className="h-3 w-3" />
                            </span>
                            <input
                              className="flex-1 border border-green-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-green-50"
                              placeholder={`Add player ${index + 1}`}
                              value={newPlayerName}
                              onChange={e => setNewPlayerName(e.target.value)}
                              disabled={isLoading}
                              onKeyPress={e => e.key === 'Enter' && newPlayerName.trim() && addPlayer()}
                            />
                            <input
                              type="number"
                              className="w-16 border border-green-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-green-50"
                              placeholder="Rating"
                              value={newPlayerRating}
                              onChange={e =>
                                setNewPlayerRating(e.target.value === '' ? '' : parseInt(e.target.value))
                              }
                              disabled={isLoading}
                              min="0"
                              max="3000"
                              onKeyPress={e => e.key === 'Enter' && newPlayerName.trim() && addPlayer()}
                            />
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                              onClick={addPlayer}
                              disabled={!newPlayerName.trim() || isLoading}
                              title="Add player"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-8">
                            {/* Empty slot - same height as player rows */}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t flex justify-end space-x-3 flex-shrink-0">
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
