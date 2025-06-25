import React from 'react';
import { Shield, Eye } from 'lucide-react';

interface AdminToggleProps {
  isAdminMode: boolean;
  onToggle: () => void;
}

const AdminToggle: React.FC<AdminToggleProps> = ({ isAdminMode, onToggle }) => {
  return (
    <button
      className="flex items-center space-x-2 px-4 py-2 border rounded hover:bg-gray-100 transition"
      onClick={onToggle}
    >
      {isAdminMode ? <Eye size={18} /> : <Shield size={18} />}
      <span className="text-sm font-medium">
        {isAdminMode ? 'Viewer Mode' : 'Admin Mode'}
      </span>
    </button>
  );
};

export default AdminToggle;
