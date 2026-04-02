// src/lib/botDetection.ts
// PURPOSE: Detect headless browsers and automated tools that are breaking
// the platform's infinite scroll and CSS layout.
// CALLED BY: ProtectedRoute, SecureFeed, and app bootstrap in main.tsx

export interface BotDetectionResult {
  isBot: boolean;
  signals: string[];
  confidence: 'low' | 'medium' | 'high';
}

export function detectBot(): BotDetectionResult {
  const signals: string[] = [];

  // Signal 1: Selenium/Puppeteer/Playwright set this flag
  if (navigator.webdriver === true) signals.push('webdriver');

  // Signal 2: Headless Chrome has this in UA
  if (/HeadlessChrome/.test(navigator.userAgent)) signals.push('headless-chrome');

  // Signal 3: Missing plugins — only meaningful on desktop Chrome where they're expected
  const isDesktopChrome = /Chrome/.test(navigator.userAgent)
    && !/Mobile/.test(navigator.userAgent)
    && typeof (window as unknown as { chrome?: unknown }).chrome !== 'undefined';
  if (isDesktopChrome && navigator.plugins.length === 0) signals.push('no-plugins');

  // Signal 4: Real browsers have language set
  if (!navigator.language) signals.push('no-language');

  // Signal 5: PhantomJS / other known bots
  if (/PhantomJS|python-requests|curl|wget/.test(navigator.userAgent)) {
    signals.push('known-bot-ua');
  }

  // Signal 6: Chrome object missing despite Chrome UA (headless indicator)
  const isChrome = /Chrome/.test(navigator.userAgent);
  const hasChromeObject = typeof (window as unknown as { chrome?: unknown }).chrome !== 'undefined';
  if (isChrome && !hasChromeObject) signals.push('missing-chrome-object');

  const confidence =
    signals.length >= 3 ? 'high' :
    signals.length === 2 ? 'medium' : 'low';

  return {
    isBot: signals.length >= 2,
    signals,
    confidence,
  };
}

// Lightweight version for use in scroll guards (called frequently)
export function isLikelyBot(): boolean {
  return navigator.webdriver === true ||
    /HeadlessChrome/.test(navigator.userAgent) ||
    navigator.plugins.length === 0;
}
