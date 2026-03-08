import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

export interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  target?: string; // data-tour attribute value
  placement?: 'right' | 'left' | 'bottom' | 'center';
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PageTourProps {
  /** Unique key for localStorage persistence, e.g. 'dashboard-tour' */
  tourKey: string;
  steps: TourStep[];
  userId?: string;
}

export const PageTour: React.FC<PageTourProps> = ({ tourKey, steps, userId }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || steps.length === 0) return;
    const done = localStorage.getItem(tourKey) === 'true';
    if (!done) {
      setStep(0);
      setOpen(true);
    }
  }, [tourKey, userId, steps.length]);

  const current = steps[step];

  const MAX_HIGHLIGHT_W = 500;
  const MAX_HIGHLIGHT_H = 400;

  const measureTarget = useCallback(() => {
    if (!current?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${current.target}"]`) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }
    // Detect hidden elements (display:none, hidden class, zero size)
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
      setTargetRect(null);
      return;
    }
    if (el.offsetWidth === 0 || el.offsetHeight === 0) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Clamp to viewport
      let top = Math.max(0, rect.top);
      let left = Math.max(0, rect.left);
      let width = Math.max(0, Math.min(rect.right, vw) - left);
      let height = Math.max(0, Math.min(rect.bottom, vh) - top);
      // Cap dimensions — centre the cutout on the element if it's too large
      if (width > MAX_HIGHLIGHT_W) {
        const cx = left + width / 2;
        width = MAX_HIGHLIGHT_W;
        left = Math.max(0, Math.min(cx - width / 2, vw - width));
      }
      if (height > MAX_HIGHLIGHT_H) {
        const cy = top + height / 2;
        height = MAX_HIGHLIGHT_H;
        top = Math.max(0, Math.min(cy - height / 2, vh - height));
      }
      setTargetRect({ top, left, width, height });
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
    localStorage.setItem(tourKey, 'true');
    setOpen(false);
  }, [tourKey]);

  if (!open || !current) return null;

  const isLast = step === steps.length - 1;
  const isCentered = !current.target || !targetRect;
  const padding = 8;

  const clampTop = (rawTop: number): number => {
    const tooltipH = tooltipRef.current?.offsetHeight || 280;
    return Math.min(Math.max(16, rawTop), window.innerHeight - tooltipH - 16);
  };

  const getTooltipStyle = (): React.CSSProperties => {
    const centered: React.CSSProperties = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    if (isCentered) return centered;

    const r = targetRect!;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipWidth = 340;
    const gap = 16;
    const minSideSpace = tooltipWidth + gap + 16;

    // Determine effective placement with fallback
    let placement = current.placement || 'right';
    const spaceRight = vw - (r.left + r.width + padding);
    const spaceLeft = r.left - padding;
    const spaceBottom = vh - (r.top + r.height + padding);

    if (placement === 'right' && spaceRight < minSideSpace) {
      placement = spaceLeft >= minSideSpace ? 'left' : spaceBottom >= 200 ? 'bottom' : 'center';
    } else if (placement === 'left' && spaceLeft < minSideSpace) {
      placement = spaceRight >= minSideSpace ? 'right' : spaceBottom >= 200 ? 'bottom' : 'center';
    } else if (placement === 'bottom' && spaceBottom < 200) {
      placement = spaceRight >= minSideSpace ? 'right' : spaceLeft >= minSideSpace ? 'left' : 'center';
    }

    if (placement === 'center') return centered;

    switch (placement) {
      case 'right':
        return {
          position: 'fixed',
          top: clampTop(r.top + r.height / 2 - 100),
          left: Math.min(r.left + r.width + padding + gap, vw - tooltipWidth - 16),
          maxWidth: tooltipWidth,
        };
      case 'left':
        return {
          position: 'fixed',
          top: clampTop(r.top + r.height / 2 - 100),
          left: Math.max(16, r.left - padding - gap - tooltipWidth),
          maxWidth: tooltipWidth,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: clampTop(r.top + r.height + padding + gap),
          left: Math.max(16, Math.min(r.left + r.width / 2 - tooltipWidth / 2, vw - tooltipWidth - 16)),
          maxWidth: tooltipWidth,
        };
      default:
        return centered;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={completeTour}
      />

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

      <div
        ref={tooltipRef}
        className="z-[2] w-[340px] rounded-xl border border-border bg-popover p-5 shadow-2xl transition-all duration-300"
        style={getTooltipStyle()}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
          {current.icon}
        </div>
        <h3 className="text-lg font-bold text-popover-foreground text-center mb-2">
          {current.title}
        </h3>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
          {current.description}
        </p>
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
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={completeTour}>
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
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
