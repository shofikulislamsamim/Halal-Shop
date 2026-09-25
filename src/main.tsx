import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import './index.css';

const root = document.getElementById('root');
const startupFallback = document.getElementById('app-startup-fallback');

try {
  if (!root) throw new Error('Halal Shop root element was not found.');

  createRoot(root).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  const showStartupError = (window as Window & { __halalShopStartupError?: (message: unknown) => void }).__halalShopStartupError;
  showStartupError?.(error instanceof Error ? error.stack || error.message : error);
  throw error;
}
