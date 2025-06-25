import { jsx as _jsx } from "react/jsx-runtime";
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
const queryClient = new QueryClient();
ReactDOM.render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(App, {}) }), document.getElementById('root'));
