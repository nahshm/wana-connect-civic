import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { initWebVitals } from './lib/vitals'
import { initGlobalErrorHandling } from './lib/error-tracking'
import { detectBot } from './lib/botDetection'

// Run bot detection at startup
const _botResult = detectBot();
if (_botResult.isBot && import.meta.env.PROD) {
  if (_botResult.confidence === 'high') {
    document.body.innerHTML = '<div></div>';
    throw new Error('Access denied');
  }
}

// Recover from stale chunks after a redeploy: reload once to fetch fresh assets
const RELOAD_KEY = 'wanaiq:chunk-reload';
const recoverFromStaleChunk = () => {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  }
};
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  recoverFromStaleChunk();
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = String((e.reason as Error)?.message || e.reason || '');
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
    recoverFromStaleChunk();
  }
});

// Initialize performance monitoring
initWebVitals();
initGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider><App /></HelmetProvider>
);


// Load Google Fonts after page load (non-blocking)
window.addEventListener('load', () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
});
