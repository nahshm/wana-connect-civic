import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, Share, Plus, MoreVertical, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">App Installed!</h1>
        <p className="text-muted-foreground">ama is installed on your device. You can find it on your home screen.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Install ama</h1>
        <p className="text-muted-foreground text-lg">
          Get the full app experience — faster, offline-capable, and always one tap away.
        </p>
      </div>

      {deferredPrompt && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Ready to install</p>
                <p className="text-sm text-muted-foreground">Add ama to your device</p>
              </div>
            </div>
            <Button onClick={handleInstall} size="lg">Install Now</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {platform === 'ios' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5" /> Install on iOS
              </CardTitle>
              <CardDescription>Safari required for iOS installation</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Open this page in <strong>Safari</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap the <strong>Share</strong> button <Share className="w-4 h-4 inline" /> at the bottom</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="w-4 h-4 inline" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {platform === 'android' && !deferredPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5" /> Install on Android
              </CardTitle>
              <CardDescription>Chrome required for Android installation</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Open this page in <strong>Chrome</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap the <strong>menu</strong> <MoreVertical className="w-4 h-4 inline" /> (three dots) at the top right</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {platform === 'desktop' && !deferredPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="w-5 h-5" /> Install on Desktop
              </CardTitle>
              <CardDescription>Chrome, Edge, or Brave recommended</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Look for the <strong>install icon</strong> <Download className="w-4 h-4 inline" /> in the address bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Click <strong>"Install"</strong> when prompted</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why install?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>⚡ Faster loading — cached for instant access</li>
              <li>📱 Full-screen experience — no browser bars</li>
              <li>🔔 Push notifications for activity updates</li>
              <li>📴 Basic offline support for browsing cached content</li>
              <li>🏠 One-tap access from your home screen</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;
