import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Lock, User } from 'lucide-react';
const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await onLogin(credentials);
            onClose();
            setCredentials({ username: '', password: '' });
        }
        catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleClose = () => {
        setCredentials({ username: '', password: '' });
        setError('');
        onClose();
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Admin Login" }), _jsx("button", { onClick: handleClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded", children: error })), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "username", className: "block text-sm font-medium text-gray-700 mb-2", children: "Username" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx("input", { id: "username", type: "text", value: credentials.username, onChange: (e) => setCredentials({ ...credentials, username: e.target.value }), className: "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500", placeholder: "Enter your username", required: true, disabled: isLoading })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx("input", { id: "password", type: "password", value: credentials.password, onChange: (e) => setCredentials({ ...credentials, password: e.target.value }), className: "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500", placeholder: "Enter your password", required: true, disabled: isLoading })] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { type: "button", onClick: handleClose, className: "flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors", disabled: isLoading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed", disabled: isLoading, children: isLoading ? 'Logging in...' : 'Login' })] })] })] }) }));
};
export default LoginModal;
