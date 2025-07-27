import React from 'react';
import { Shield, Eye } from 'lucide-react';

interface AdminToggleProps {
  isAdminMode: boolean;
  onToggle: () => void;
}

const AdminToggle: React.FC<AdminToggleProps> = ({ isAdminMode, onToggle }) => {
  return (
    <button
      className={`flex items-center space-x-2 px-4 py-2 border rounded transition ${
        isAdminMode 
          ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' 
          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
      }`}
      onClick={onToggle}
    >
      {isAdminMode ? <Shield size={18} /> : <Eye size={18} />}
      <span className="text-sm font-medium">
        {isAdminMode ? 'Admin Mode' : 'Viewer Mode'}
      </span>
    </button>
  );
};

export default AdminToggle;
