import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Shield, Eye } from 'lucide-react';
const AdminToggle = ({ isAdminMode, onToggle }) => {
    return (_jsxs("button", { className: "flex items-center space-x-2 px-4 py-2 border rounded hover:bg-gray-100 transition", onClick: onToggle, children: [isAdminMode ? _jsx(Eye, { size: 18 }) : _jsx(Shield, { size: 18 }), _jsx("span", { className: "text-sm font-medium", children: isAdminMode ? 'Viewer Mode' : 'Admin Mode' })] }));
};
export default AdminToggle;
