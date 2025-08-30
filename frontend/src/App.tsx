import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import TournamentHome from '@/components/TournamentHome';
import Schedule from '@/components/Schedule';
import Standings from '@/components/Standings';
import Teams from '@/components/Teams';
import BestPlayers from '@/components/BestPlayers';
import TournamentManager from '@/components/TournamentManager';
import LoginModal from '@/components/LoginModal';
import { Tournament, TabType } from '@/types';
import { apiService as api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const App: React.FC = () => {
  // Initialize activeTab from localStorage, fallback to 'schedule'
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('chesshub-active-tab');
    const validTabs: TabType[] = ['home', 'teams', 'schedule', 'standings', 'bestPlayers', 'tournaments'];
    return (savedTab && validTabs.includes(savedTab as TabType)) ? (savedTab as TabType) : 'schedule';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isAuthenticated,
    adminMode,
    toggleAdminMode,
    login,
    logout,
  } = useAuth();

  // Function to handle tab changes with persistence
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('chesshub-active-tab', tab);
  };

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        const response = await api.getCurrentTournament();
        setTournament(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching tournament:', err);
        setError('Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, []);

  const handleTournamentUpdate = async (shouldChangeTab = false) => {
    try {
      const response = await api.getCurrentTournament();
      setTournament(response);
      // Auto-switch to specified tab only if requested
      if (shouldChangeTab && activeTab === 'tournaments') {
        handleTabChange('home');
      }
    } catch (err) {
      console.error('Error refreshing tournament:', err);
    }
  };

  const handleTournamentCreated = async () => {
    try {
      const response = await api.getCurrentTournament();
      setTournament(response);
      // On tournament creation, switch to teams tab
      handleTabChange('teams');
    } catch (err) {
      console.error('Error refreshing tournament:', err);
    }
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      await login(credentials);
      setShowLoginModal(false);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
  };
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-600">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-xl font-semibold mb-2">Something went wrong</div>
            <div className="text-gray-600">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return <TournamentHome tournament={tournament} isAdmin={isAuthenticated && adminMode} onUpdate={handleTournamentUpdate} />;
      case 'schedule':
        return <Schedule isAdmin={isAuthenticated && adminMode} onUpdate={handleTournamentUpdate} tournament={tournament} />;
      case 'standings':
        return <Standings isAdmin={isAuthenticated && adminMode} onUpdate={handleTournamentUpdate} />;
      case 'teams':
        return <Teams isAdmin={isAuthenticated && adminMode} tournament={tournament} onUpdate={handleTournamentUpdate} onTabChange={handleTabChange} />;
      case 'bestPlayers':
        return <BestPlayers  />;
      case 'tournaments':
        return <TournamentManager 
          isAdmin={isAuthenticated && adminMode} 
          currentTournament={tournament} 
          onTournamentChanged={handleTournamentUpdate}
          onTournamentCreated={handleTournamentCreated}
          onTabChange={handleTabChange}
        />;
      default:
        return null;
    }
  };

  return (
    <Layout
      currentTab={activeTab}
      onTabSelect={handleTabChange}
      tournament={tournament}
      isAdmin={isAuthenticated && adminMode}
      onAdminToggle={toggleAdminMode}
      isAuthenticated={isAuthenticated}
      onLoginClick={() => setShowLoginModal(true)}
      onLogout={handleLogout}
    >
      {renderTabContent()}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </Layout>
  );
};

export default App;
