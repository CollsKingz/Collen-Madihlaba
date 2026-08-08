import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle browser extension noise (e.g. MetaMask / web3 / browser extension auto-injection failures)
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason?.message || event.reason?.stack || event.reason || '').toLowerCase();
  if (
    reasonStr.includes('metamask') ||
    reasonStr.includes('ethereum') ||
    reasonStr.includes('user rejected') ||
    reasonStr.includes('failed to connect') ||
    reasonStr.includes('provider')
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

window.addEventListener(
  'error',
  (event) => {
    const msgStr = String(event.message || event.error?.message || '').toLowerCase();
    const sourceStr = String(event.filename || '').toLowerCase();
    if (
      msgStr.includes('metamask') ||
      msgStr.includes('ethereum') ||
      msgStr.includes('failed to connect') ||
      sourceStr.includes('metamask') ||
      sourceStr.includes('extension')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
