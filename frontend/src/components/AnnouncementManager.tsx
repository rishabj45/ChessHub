import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Announcement, AnnouncementCreate, AnnouncementUpdate } from '@/types';
import { 
  MessageSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Pin, 
  PinOff, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface AnnouncementManagerProps {
  tournamentId: number;
  isAdmin: boolean;
  onUpdate?: () => void;
}

const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({ 
  tournamentId, 
  isAdmin, 
  onUpdate 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState<AnnouncementCreate>({
    title: '',
    content: '',
    is_pinned: false,
    tournament_id: tournamentId
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementUpdate>({});

  useEffect(() => {
    loadAnnouncements();
  }, [tournamentId]);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTournamentAnnouncements(tournamentId);
      setAnnouncements(response.announcements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      await apiService.createAnnouncement(newAnnouncement);
      setNewAnnouncement({
        title: '',
        content: '',
        is_pinned: false,
        tournament_id: tournamentId
      });
      setIsCreating(false);
      await loadAnnouncements();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingAnnouncement.title?.trim() && !editingAnnouncement.content?.trim()) {
      alert('Please provide title or content to update');
      return;
    }

    try {
      await apiService.updateAnnouncement(id, editingAnnouncement);
      setEditingId(null);
      setEditingAnnouncement({});
      await loadAnnouncements();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Failed to update announcement');
    }
  };

  const handleDeleteConfirm = (id: number) => {
    setShowDeleteConfirm(id);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      setShowDeleteConfirm(null);
      await apiService.deleteAnnouncement(id);
      await loadAnnouncements();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  const togglePin = async (announcement: Announcement) => {
    try {
      await apiService.updateAnnouncement(announcement.id, {
        is_pinned: !announcement.is_pinned
      });
      await loadAnnouncements();
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to update announcement');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setEditingAnnouncement({
      title: announcement.title,
      content: announcement.content,
      is_pinned: announcement.is_pinned
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingAnnouncement({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't show anything to viewers if there are no announcements
  if (!isAdmin && announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </button>
        )}
      </div>

      {/* Create New Announcement */}
      {isAdmin && isCreating && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">Create New Announcement</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter announcement title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <RichTextEditor
                value={newAnnouncement.content}
                onChange={(content) => setNewAnnouncement({ ...newAnnouncement, content })}
                placeholder="Enter announcement content..."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pin-new"
                checked={newAnnouncement.is_pinned}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="pin-new" className="text-sm font-medium text-gray-700">
                Pin this announcement
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Announcements Yet</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`border rounded-lg shadow-sm transition-all ${
                announcement.is_pinned 
                  ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              {editingId === announcement.id ? (
                /* Edit Mode */
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={editingAnnouncement.title || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  />
                  
                  <RichTextEditor
                    value={editingAnnouncement.content || ''}
                    onChange={(content) => setEditingAnnouncement({ ...editingAnnouncement, content })}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`pin-edit-${announcement.id}`}
                        checked={editingAnnouncement.is_pinned ?? false}
                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, is_pinned: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor={`pin-edit-${announcement.id}`} className="text-sm font-medium text-gray-700">
                        Pin this announcement
                      </label>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(announcement.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {announcement.title}
                      </h3>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => togglePin(announcement)}
                          className={`p-1 rounded transition-colors ${
                            announcement.is_pinned
                              ? 'text-yellow-600 hover:text-yellow-700'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                        >
                          {announcement.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(announcement)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(announcement.id)}
                          disabled={deleting === announcement.id}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="text-gray-700 mb-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      {announcement.updated_at !== announcement.created_at 
                        ? `${formatDate(announcement.updated_at)} (edited)`
                        : formatDate(announcement.created_at)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Delete Announcement
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this announcement? 
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting === showDeleteConfirm ? 'Deleting...' : 'Delete Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
