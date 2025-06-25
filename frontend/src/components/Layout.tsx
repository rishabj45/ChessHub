import React from 'react';
import AdminToggle from './AdminToggle';
import { Trophy } from 'lucide-react';
import { TabType, LayoutProps } from '@/types';

const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onTabSelect,
  tournament,
  isAdmin,
  onAdminToggle,
  isAuthenticated,
  onLoginClick,
  onLogout,
}) => {
  return (
    <div className="min-h-screen flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <AdminToggle isAdminMode={isAdmin} onToggle={onAdminToggle} />
          )}
          <span className="ml-2 text-lg font-medium text-gray-700">
            {tournament?.name || 'No Tournament Selected'}
          </span>
          {tournament && <Trophy className="ml-2 text-yellow-500" />}
        </div>

        <div>
          {!isAuthenticated ? (
            <button
              onClick={onLoginClick}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Admin Login
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      <nav className="bg-gray-200 p-2 flex space-x-4 rounded">
        {['teams', 'schedule', 'standings', 'bestPlayers'].map((tab) => (
          <div
            key={tab}
            className={`cursor-pointer px-3 py-1 rounded ${
              currentTab === tab ? 'bg-primary-600 text-white' : 'hover:bg-gray-300'
            }`}
            onClick={() => onTabSelect(tab as TabType)}
          >
            {tab}
          </div>
        ))}
      </nav>

      <main className="flex-1 container mx-auto p-4">{children}</main>
    </div>
  );
};

export default Layout;
