import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Shield, Eye } from 'lucide-react';
const AdminToggle = ({ isAdminMode, onToggle }) => {
    return (_jsxs("button", { className: `flex items-center space-x-2 px-4 py-2 border rounded transition ${isAdminMode
            ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`, onClick: onToggle, children: [isAdminMode ? _jsx(Shield, { size: 18 }) : _jsx(Eye, { size: 18 }), _jsx("span", { className: "text-sm font-medium", children: isAdminMode ? 'Admin Mode' : 'Viewer Mode' })] }));
};
export default AdminToggle;
