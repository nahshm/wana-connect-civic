import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Layers,
  Hash,
  MessageSquare,
  Info,
  PlusCircle,
  Settings,
  Shield,
} from 'lucide-react';

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const USER_STEPS: TourStep[] = [
  {
    icon: <Compass className="h-8 w-8 text-primary" />,
    title: 'Welcome to Your Community!',
    description:
      'This is your civic community hub. Here you can engage with your neighbours, discuss local issues, and participate in decision-making. Let us show you around!',
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Level Selector',
    description:
      'On the left rail you\'ll see icons for your County, Constituency, and Ward communities. Click any level to switch between geographic communities you belong to.',
  },
  {
    icon: <Hash className="h-8 w-8 text-primary" />,
    title: 'Channel List',
    description:
      'Each community has channels organised by category — Posts, Chat, Announcements, and more. Click a channel name to view its content in the main area.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Main Content Area',
    description:
      'The centre of the screen shows the active channel\'s content — community posts, live chat, or announcements. This is where the conversation happens!',
  },
  {
    icon: <Info className="h-8 w-8 text-primary" />,
    title: 'Community Sidebar',
    description:
      'On the right you\'ll find community info, rules, and moderators. It helps you understand the community\'s guidelines at a glance.',
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    icon: <PlusCircle className="h-8 w-8 text-primary" />,
    title: 'Channel Management',
    description:
      'As an admin, you can create new channels using the "+" button in the channel list. Organise discussions with different channel types — feed, chat, or announcements.',
  },
  {
    icon: <Settings className="h-8 w-8 text-primary" />,
    title: 'Community Settings',
    description:
      'Update your community\'s avatar, banner, and description from the settings. A well-branded community attracts more engagement!',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Moderation Tools',
    description:
      'You can manage posts, moderate content, and keep discussions constructive. Look for moderation options on posts and in the community settings.',
  },
];

const USER_TOUR_KEY = 'platform-tour-completed';
function getAdminTourKey(communityId: string) {
  return `admin-tour-completed-${communityId}`;
}

interface PlatformTourProps {
  communityId: string;
  isAdmin: boolean;
  isModerator: boolean;
}

export const PlatformTour: React.FC<PlatformTourProps> = ({
  communityId,
  isAdmin,
  isModerator,
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [tourType, setTourType] = useState<'user' | 'admin'>('user');

  const steps = useMemo(
    () => (tourType === 'admin' ? [...USER_STEPS, ...ADMIN_STEPS] : USER_STEPS),
    [tourType]
  );

  useEffect(() => {
    // Determine which tour to show (admin takes priority if both needed)
    const userDone = localStorage.getItem(USER_TOUR_KEY) === 'true';
    const adminDone =
      localStorage.getItem(getAdminTourKey(communityId)) === 'true';

    if ((isAdmin || isModerator) && !adminDone) {
      setTourType('admin');
      setStep(0);
      setOpen(true);
    } else if (!userDone) {
      setTourType('user');
      setStep(0);
      setOpen(true);
    }
  }, [communityId, isAdmin, isModerator]);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const completeTour = () => {
    if (tourType === 'admin') {
      localStorage.setItem(getAdminTourKey(communityId), 'true');
      localStorage.setItem(USER_TOUR_KEY, 'true'); // also mark user tour done
    } else {
      localStorage.setItem(USER_TOUR_KEY, 'true');
    }
    setOpen(false);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && completeTour()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {current.icon}
          </div>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={completeTour}>
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={completeTour}>
                Get Started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
