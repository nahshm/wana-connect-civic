import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initWebVitals } from './lib/vitals'
import { initGlobalErrorHandling } from './lib/error-tracking'

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
