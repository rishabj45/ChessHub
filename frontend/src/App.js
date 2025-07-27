import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import TournamentHome from '@/components/TournamentHome';
import Schedule from '@/components/Schedule';
import Standings from '@/components/Standings';
import Teams from '@/components/Teams';
import BestPlayers from '@/components/BestPlayers';
import TournamentManager from '@/components/TournamentManager';
import LoginModal from '@/components/LoginModal';
import { apiService as api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
const App = () => {
    // Initialize activeTab from localStorage, fallback to 'home'
    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('chesshub-active-tab');
        const validTabs = ['home', 'teams', 'schedule', 'standings', 'bestPlayers', 'tournaments'];
        return (savedTab && validTabs.includes(savedTab)) ? savedTab : 'home';
    });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, adminMode, toggleAdminMode, login, logout, } = useAuth();
    // Function to handle tab changes with persistence
    const handleTabChange = (tab) => {
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
            }
            catch (err) {
                console.error('Error fetching tournament:', err);
                setError('Failed to load tournament data');
            }
            finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, []);
    const handleTournamentUpdate = async () => {
        try {
            const response = await api.getCurrentTournament();
            setTournament(response);
            // Auto-switch to home tab after tournament creation/update
            if (activeTab === 'tournaments') {
                handleTabChange('home');
            }
        }
        catch (err) {
            console.error('Error refreshing tournament:', err);
        }
    };
    const handleLogin = async (credentials) => {
        try {
            await login(credentials);
            setShowLoginModal(false);
            return true;
        }
        catch (error) {
            throw error;
        }
    };
    const handleLogout = () => {
        logout();
    };
    const renderTabContent = () => {
        if (loading) {
            return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
        }
        if (error) {
            return (_jsx("div", { className: "flex items-center justify-center h-64 text-red-600", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u26A0\uFE0F" }), _jsx("div", { className: "text-xl font-semibold mb-2", children: "Something went wrong" }), _jsx("div", { className: "text-gray-600", children: error }), _jsx("button", { onClick: () => window.location.reload(), className: "mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: "Retry" })] }) }));
        }
        switch (activeTab) {
            case 'home':
                return _jsx(TournamentHome, { tournament: tournament, isAdmin: isAuthenticated && adminMode, onUpdate: handleTournamentUpdate });
            case 'schedule':
                return _jsx(Schedule, { isAdmin: isAuthenticated && adminMode, onUpdate: handleTournamentUpdate, tournament: tournament });
            case 'standings':
                return _jsx(Standings, { isAdmin: isAuthenticated && adminMode, onUpdate: handleTournamentUpdate });
            case 'teams':
                return _jsx(Teams, { isAdmin: isAuthenticated && adminMode, tournament: tournament });
            case 'bestPlayers':
                return _jsx(BestPlayers, {});
            case 'tournaments':
                return _jsx(TournamentManager, { isAdmin: isAuthenticated && adminMode, currentTournament: tournament, onTournamentChanged: handleTournamentUpdate });
            default:
                return null;
        }
    };
    return (_jsxs(Layout, { currentTab: activeTab, onTabSelect: handleTabChange, tournament: tournament, isAdmin: isAuthenticated && adminMode, onAdminToggle: toggleAdminMode, isAuthenticated: isAuthenticated, onLoginClick: () => setShowLoginModal(true), onLogout: handleLogout, children: [renderTabContent(), showLoginModal && (_jsx(LoginModal, { isOpen: showLoginModal, onLogin: handleLogin, onClose: () => setShowLoginModal(false) }))] }));
};
export default App;
