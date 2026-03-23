import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Smartphone, Monitor, Share, Plus, MoreVertical, Check, ChevronDown, Zap, Bell, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You're all set!</h1>
        <p className="text-muted-foreground max-w-sm">
          ama is installed on your device. Find it on your home screen for instant access.
        </p>
      </div>
    );
  }

  const benefits = [
    { icon: Zap, label: 'Lightning fast', desc: 'Cached for instant loading' },
    { icon: Bell, label: 'Notifications', desc: 'Stay updated on civic activity' },
    { icon: Monitor, label: 'Full screen', desc: 'No browser bars — immersive experience' },
    { icon: WifiOff, label: 'Offline ready', desc: 'Browse cached content without internet' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="relative flex flex-col items-center pt-12 pb-8 px-4">
          <img
            src="/pwa-logo-wide.png"
            alt="ama"
            className="h-28 w-auto object-contain mb-6"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-3">
            Install ama
          </h1>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            Your civic platform, one tap away. Faster, smarter, always accessible.
          </p>

          {deferredPrompt && (
            <Button
              onClick={handleInstall}
              size="lg"
              className="mt-6 gap-2 text-base h-12 px-8 rounded-full shadow-lg shadow-primary/20"
            >
              <Download className="h-5 w-5" />
              Install Now
            </Button>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {benefits.map(({ icon: Icon, label, desc }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Instructions */}
      <div className="px-4 pb-12 max-w-lg mx-auto space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Installation Guide
        </h2>

        {platform === 'ios' && (
          <InstructionCard
            title="Install on iOS"
            icon={<Smartphone className="h-5 w-5" />}
            defaultOpen
            steps={[
              <>Open this page in <strong>Safari</strong></>,
              <>Tap the <strong>Share</strong> button <Share className="h-3.5 w-3.5 inline" /> at the bottom</>,
              <>Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="h-3.5 w-3.5 inline" /></>,
              <>Tap <strong>"Add"</strong> to confirm</>,
            ]}
          />
        )}

        {platform === 'android' && !deferredPrompt && (
          <InstructionCard
            title="Install on Android"
            icon={<Smartphone className="h-5 w-5" />}
            defaultOpen
            steps={[
              <>Open this page in <strong>Chrome</strong></>,
              <>Tap the <strong>menu</strong> <MoreVertical className="h-3.5 w-3.5 inline" /> (three dots) top right</>,
              <>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></>,
            ]}
          />
        )}

        {platform === 'desktop' && !deferredPrompt && (
          <InstructionCard
            title="Install on Desktop"
            icon={<Monitor className="h-5 w-5" />}
            defaultOpen
            steps={[
              <>Look for the <strong>install icon</strong> <Download className="h-3.5 w-3.5 inline" /> in the address bar</>,
              <>Click <strong>"Install"</strong> when prompted</>,
            ]}
          />
        )}

        {/* Show other platforms collapsed */}
        {platform !== 'ios' && (
          <InstructionCard
            title="Install on iOS"
            icon={<Smartphone className="h-5 w-5" />}
            steps={[
              <>Open in <strong>Safari</strong> → tap <Share className="h-3.5 w-3.5 inline" /> → <strong>"Add to Home Screen"</strong></>,
            ]}
          />
        )}
        {platform !== 'android' && (
          <InstructionCard
            title="Install on Android"
            icon={<Smartphone className="h-5 w-5" />}
            steps={[
              <>Open in <strong>Chrome</strong> → tap <MoreVertical className="h-3.5 w-3.5 inline" /> → <strong>"Install app"</strong></>,
            ]}
          />
        )}
        {platform !== 'desktop' && (
          <InstructionCard
            title="Install on Desktop"
            icon={<Monitor className="h-5 w-5" />}
            steps={[
              <>Look for the <Download className="h-3.5 w-3.5 inline" /> icon in the address bar → click <strong>"Install"</strong></>,
            ]}
          />
        )}
      </div>
    </div>
  );
};

interface InstructionCardProps {
  title: string;
  icon: React.ReactNode;
  steps: React.ReactNode[];
  defaultOpen?: boolean;
}

const InstructionCard = ({ title, icon, steps, defaultOpen = false }: InstructionCardProps) => (
  <Collapsible defaultOpen={defaultOpen}>
    <Card className="border-border/50 overflow-hidden">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
            <span className="font-medium text-sm text-foreground">{title}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4">
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </CollapsibleContent>
    </Card>
  </Collapsible>
);

export default Install;
