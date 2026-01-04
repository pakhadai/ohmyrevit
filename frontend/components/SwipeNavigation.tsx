'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { useTheme } from '@/lib/theme';

// Navigation order for swipe
const NAV_ORDER = ['/', '/marketplace', '/cart', '/profile'];

// Swipe sensitivity settings
const SWIPE_THRESHOLD = 120; // Minimum horizontal distance (increased from 80)
const VELOCITY_THRESHOLD = 0.8; // Minimum velocity (increased from 0.5)
const VERTICAL_LOCK_RATIO = 1.5; // If vertical > horizontal * ratio, ignore swipe

interface SwipeNavigationProps {
  children: React.ReactNode;
}

export default function SwipeNavigation({ children }: SwipeNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const controls = useAnimation();
  const { theme } = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0); // -1 to 1
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Get current page index
  const currentIndex = NAV_ORDER.indexOf(pathname);
  const isSwipeable = currentIndex !== -1;

  // Reset animation on route change
  useEffect(() => {
    controls.set({ x: 0, opacity: 1 });
    setSwipeProgress(0);
    setIsVerticalScroll(false);
  }, [pathname, controls]);

  const handleDragStart = useCallback(
    (_: any, info: PanInfo) => {
      dragStartRef.current = { x: info.point.x, y: info.point.y };
      setIsVerticalScroll(false);
    },
    []
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      if (!isSwipeable || isNavigating) return;

      // Check if this is primarily a vertical scroll
      const absX = Math.abs(info.offset.x);
      const absY = Math.abs(info.offset.y);

      // If vertical movement is significantly more than horizontal, lock to vertical scroll
      if (absY > absX * VERTICAL_LOCK_RATIO && absY > 20) {
        setIsVerticalScroll(true);
        setSwipeProgress(0);
        return;
      }

      // If already detected as vertical scroll, don't show swipe progress
      if (isVerticalScroll) {
        setSwipeProgress(0);
        return;
      }

      // Calculate progress for visual feedback (only if horizontal swipe)
      if (absX > absY) {
        const progress = Math.max(-1, Math.min(1, info.offset.x / 200));
        setSwipeProgress(progress);
      }
    },
    [isSwipeable, isNavigating, isVerticalScroll]
  );

  const handleDragEnd = useCallback(
    async (_: any, info: PanInfo) => {
      setSwipeProgress(0);

      if (!isSwipeable || isNavigating || isVerticalScroll) {
        setIsVerticalScroll(false);
        return;
      }

      // Check if this was primarily a horizontal swipe
      const absX = Math.abs(info.offset.x);
      const absY = Math.abs(info.offset.y);

      // Ignore if vertical movement was dominant
      if (absY > absX * 0.7) {
        await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
        return;
      }

      const isSignificantSwipe =
        absX > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > VELOCITY_THRESHOLD;

      if (!isSignificantSwipe) {
        // Snap back
        await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
        return;
      }

      const swipeDirection = info.offset.x > 0 ? -1 : 1; // -1 = right (prev), 1 = left (next)
      const nextIndex = currentIndex + swipeDirection;

      if (nextIndex < 0 || nextIndex >= NAV_ORDER.length) {
        // Bounce back if at edge
        await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
        return;
      }

      setIsNavigating(true);

      // Animate out
      const direction = swipeDirection > 0 ? -1 : 1;
      await controls.start({
        x: direction * window.innerWidth,
        opacity: 0.5,
        transition: { duration: 0.15, ease: 'easeOut' }
      });

      // Navigate
      router.push(NAV_ORDER[nextIndex]);

      // Reset position instantly
      controls.set({ x: direction * -window.innerWidth * 0.3, opacity: 0.5 });

      // Animate in
      await controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeOut' }
      });

      setIsNavigating(false);
    },
    [controls, currentIndex, isNavigating, isSwipeable, router]
  );

  // Don't apply swipe on non-main pages
  if (!isSwipeable) {
    return <>{children}</>;
  }

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < NAV_ORDER.length - 1;

  return (
    <>
      {/* Swipe indicators on edges */}
      {canGoLeft && swipeProgress > 0.1 && (
        <motion.div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: Math.min(1, swipeProgress * 2),
            x: swipeProgress * 30 - 10
          }}
        >
          <div
            className="w-10 h-20 flex items-center justify-center"
            style={{
              background: `linear-gradient(90deg, ${theme.colors.primary}40, transparent)`,
              borderRadius: '0 20px 20px 0',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </div>
        </motion.div>
      )}

      {canGoRight && swipeProgress < -0.1 && (
        <motion.div
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: Math.min(1, Math.abs(swipeProgress) * 2),
            x: swipeProgress * 30 + 10
          }}
        >
          <div
            className="w-10 h-20 flex items-center justify-center"
            style={{
              background: `linear-gradient(-90deg, ${theme.colors.primary}40, transparent)`,
              borderRadius: '20px 0 0 20px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </motion.div>
      )}

      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        dragDirectionLock
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="min-h-screen"
        style={{
          touchAction: 'pan-y',
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
