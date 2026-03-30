import { createRoot } from 'react-dom/client'
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

// Initialize performance monitoring
initWebVitals();
initGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker after page load (non-blocking)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' });
  });
}

// Load Google Fonts after page load (non-blocking)
window.addEventListener('load', () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
});
