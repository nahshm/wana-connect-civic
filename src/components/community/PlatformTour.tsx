import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  target?: string; // data-tour attribute value
  placement?: 'right' | 'left' | 'bottom' | 'center';
}

const USER_STEPS: TourStep[] = [
  {
    icon: <Compass className="h-8 w-8 text-primary" />,
    title: 'Welcome to Your Community!',
    description:
      'This is your civic community hub. Here you can engage with your neighbours, discuss local issues, and participate in decision-making. Let us show you around!',
    placement: 'center',
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Level Selector',
    description:
      'These icons represent your County, Constituency, and Ward communities. Click any level to switch between geographic communities you belong to.',
    target: 'tour-level-selector',
    placement: 'right',
  },
  {
    icon: <Hash className="h-8 w-8 text-primary" />,
    title: 'Channel List',
    description:
      'Each community has channels organised by category — Posts, Chat, Announcements, and more. Click a channel name to view its content.',
    target: 'tour-channel-list',
    placement: 'right',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Main Content Area',
    description:
      "The centre of the screen shows the active channel's content — community posts, live chat, or announcements. This is where the conversation happens!",
    target: 'tour-main-content',
    placement: 'left',
  },
  {
    icon: <Info className="h-8 w-8 text-primary" />,
    title: 'Community Sidebar',
    description:
      "On the right you'll find community info, rules, and moderators. It helps you understand the community's guidelines at a glance.",
    target: 'tour-sidebar',
    placement: 'left',
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    icon: <PlusCircle className="h-8 w-8 text-primary" />,
    title: 'Channel Management',
    description:
      'As an admin, you can create new channels using this "+" button. Organise discussions with different channel types — feed, chat, or announcements.',
    target: 'tour-add-channel',
    placement: 'right',
  },
  {
    icon: <Settings className="h-8 w-8 text-primary" />,
    title: 'Community Settings',
    description:
      "Update your community's avatar, banner, and description from the settings. A well-branded community attracts more engagement!",
    target: 'tour-settings',
    placement: 'bottom',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Moderation Tools',
    description:
      'You can manage posts, moderate content, and keep discussions constructive. Look for moderation options on posts and in the community settings.',
    placement: 'center',
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
  userId?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const PlatformTour: React.FC<PlatformTourProps> = ({
  communityId,
  isAdmin,
  isModerator,
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [tourType, setTourType] = useState<'user' | 'admin'>('user');
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(
    () => (tourType === 'admin' ? [...USER_STEPS, ...ADMIN_STEPS] : USER_STEPS),
    [tourType]
  );

  useEffect(() => {
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

  // Measure the target element whenever step changes
  const measureTarget = useCallback(() => {
    if (!current?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Small delay to let scroll finish
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    });
  }, [current]);

  useEffect(() => {
    if (!open) return;
    measureTarget();

    const handleResize = () => measureTarget();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [open, step, measureTarget]);

  const completeTour = useCallback(() => {
    if (tourType === 'admin') {
      localStorage.setItem(getAdminTourKey(communityId), 'true');
      localStorage.setItem(USER_TOUR_KEY, 'true');
    } else {
      localStorage.setItem(USER_TOUR_KEY, 'true');
    }
    setOpen(false);
  }, [tourType, communityId]);

  if (!open || !current) return null;

  const isLast = step === steps.length - 1;
  const isCentered = !current.target || !targetRect;
  const padding = 8;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCentered) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const r = targetRect!;
    const placement = current.placement || 'right';
    const tooltipWidth = 340;
    const gap = 16;

    switch (placement) {
      case 'right':
        return {
          position: 'fixed',
          top: Math.max(16, r.top + r.height / 2 - 100),
          left: r.left + r.width + gap,
          maxWidth: `min(${tooltipWidth}px, calc(100vw - ${r.left + r.width + gap + 16}px))`,
        };
      case 'left':
        return {
          position: 'fixed',
          top: Math.max(16, r.top + r.height / 2 - 100),
          right: `calc(100vw - ${r.left - gap}px)`,
          maxWidth: `min(${tooltipWidth}px, ${r.left - gap - 16}px)`,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: r.top + r.height + gap,
          left: Math.max(16, r.left + r.width / 2 - tooltipWidth / 2),
          maxWidth: tooltipWidth,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop — click to skip */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={completeTour}
      />

      {/* Spotlight cutout */}
      {!isCentered && targetRect && (
        <div
          className="absolute rounded-lg border-2 border-primary/50 transition-all duration-300 ease-in-out pointer-events-none"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            zIndex: 1,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="z-[2] w-[340px] rounded-xl border border-border bg-popover p-5 shadow-2xl transition-all duration-300"
        style={getTooltipStyle()}
      >
        {/* Icon */}
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
          {current.icon}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-popover-foreground text-center mb-2">
          {current.title}
        </h3>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
          {current.description}
        </p>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
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

        {/* Actions */}
        <div className="flex items-center justify-between">
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
        </div>
      </div>
    </div>,
    document.body
  );
};
