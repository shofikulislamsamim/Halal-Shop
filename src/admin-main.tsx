import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShopProvider } from './context/ShopContext';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer } from './components/common/Toast';
import './index.css';

const root = document.getElementById('admin-root');

try {
  if (!root) throw new Error('Halal Shop admin root was not found.');

  createRoot(root).render(
    <React.StrictMode>
      <ShopProvider>
        <AdminDashboard />
        <ToastContainer />
      </ShopProvider>
    </React.StrictMode>,
  );

  document.getElementById('admin-startup-fallback')?.remove();
} catch (error) {
  const showStartupError = (window as Window & { __halalShopAdminStartupError?: (message: unknown) => void }).__halalShopAdminStartupError;
  showStartupError?.(error instanceof Error ? error.stack || error.message : error);
  throw error;
}
