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
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <AdminToggle isAdminMode={isAdmin} onToggle={onAdminToggle} />
              )}
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-800">
                  {tournament?.name || 'No Tournament Selected'}
                </span>
                {tournament && <Trophy className="text-yellow-500 w-5 h-5" />}
              </div>
            </div>

            <div>
              {!isAuthenticated ? (
                <button
                  onClick={onLoginClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          <nav className="bg-gray-100 p-1 flex space-x-1 rounded-lg">
            {['home', 'teams', 'schedule', 'standings', 'bestPlayers'].map((tab) => (
              <div
                key={tab}
                className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentTab === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
                onClick={() => onTabSelect(tab as TabType)}
              >
                {tab === 'home' ? 'Home' : 
                 tab === 'bestPlayers' ? 'Best Players' : 
                 tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
            {isAdmin && (
              <div
                className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentTab === 'tournaments' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
                onClick={() => onTabSelect('tournaments' as TabType)}
              >
                Tournaments
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4">{children}</main>
    </div>
  );
};

export default Layout;
