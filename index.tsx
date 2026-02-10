import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MagicLinkLogin from './components/MagicLinkLogin';
import AuthCallback from './components/AuthCallback';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/magic-link" element={<MagicLinkLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Main App (handles login and authenticated routes) */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);