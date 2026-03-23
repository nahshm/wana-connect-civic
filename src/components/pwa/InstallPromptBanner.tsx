import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'ama-install-dismissed';

export const InstallPromptBanner = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show after 30s delay
    const timer = setTimeout(() => setShow(true), 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (!show) return null;

  return (
    <div className={cn(
      "fixed bottom-16 md:bottom-4 left-4 right-4 z-[60]",
      "animate-in slide-in-from-bottom-4 fade-in duration-500"
    )}>
      <div className="mx-auto max-w-md rounded-xl border border-primary/20 bg-card shadow-2xl shadow-primary/10 p-4">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-icon-512.png"
            alt="ama"
            className="h-12 w-12 rounded-xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Install ama</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Faster access, offline support & notifications
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              {deferredPrompt ? (
                <Button size="sm" onClick={handleInstall} className="h-8 gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Install
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/install'} className="h-8 text-xs">
                  Learn how
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs text-muted-foreground">
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1 -m-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
