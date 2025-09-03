'use client';

import { useState, useEffect, useRef } from 'react';

import OptInModal from './OptInModal';

import { trackNewsletterEvent } from '@/lib/abtest';

interface ExitIntentProps {
  enabled?: boolean;
  delay?: number; // Delay before exit intent can trigger (ms)
  cookieExpiry?: number; // Hours before showing again
  sensitivity?: number; // Mouse movement sensitivity
  children?: React.ReactNode;
}

export default function ExitIntent({
  enabled = true,
  delay = 5000, // 5 seconds
  cookieExpiry = 24, // 24 hours
  sensitivity = 20,
  children,
}: ExitIntentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canTrigger, setCanTrigger] = useState(false);
  const hasTriggered = useRef(false);
  const lastMouseY = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Check if already shown recently (cookie)
    const exitIntentShown = document.cookie
      .split('; ')
      .find((row) => row.startsWith('exit_intent_shown='));

    if (exitIntentShown) {
      return; // Don't show if recently shown
    }

    // Enable exit intent detection after delay
    const timer = setTimeout(() => {
      setCanTrigger(true);
    }, delay);

    const handleMouseMove = (e: MouseEvent) => {
      lastMouseY.current = e.clientY;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if:
      // 1. Can trigger (after delay)
      // 2. Mouse moved to top of screen
      // 3. Haven't triggered before
      // 4. Moving upward with enough speed
      if (
        canTrigger &&
        e.clientY <= sensitivity &&
        !hasTriggered.current &&
        lastMouseY.current > sensitivity
      ) {
        hasTriggered.current = true;
        setIsModalOpen(true);

        // Track exit intent trigger
        const sessionId =
          document.cookie
            .split('; ')
            .find((row) => row.startsWith('session_id='))
            ?.split('=')[1] || '';

        trackNewsletterEvent('view', sessionId, 'modal', {
          exitIntent: true,
          trigger: 'exit_intent',
        });

        // Set cookie to prevent showing again
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + cookieExpiry);
        document.cookie = `exit_intent_shown=true; expires=${expiryDate.toUTCString()}; path=/`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, delay, cookieExpiry, sensitivity, canTrigger]);

  const handleModalClose = () => {
    setIsModalOpen(false);

    // Track exit intent close
    if (typeof window !== 'undefined') {
      const sessionId =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith('session_id='))
          ?.split('=')[1] || '';

      trackNewsletterEvent('click', sessionId, 'modal', {
        action: 'close',
        exitIntent: true,
        trigger: 'exit_intent',
      });
    }
  };

  return (
    <>
      {children}

      <OptInModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        trigger="exit_intent"
        title="Warten Sie! Verpassen Sie keine KI-Updates!"
        description="Sie sind dabei, die neuesten KI-Entwicklungen zu verpassen. Bleiben Sie mit unserem kostenlosen Newsletter auf dem Laufenden."
        incentive="🚀 Exklusiv: Früher Zugang zu neuen KI-Tools und -Features"
      />
    </>
  );
}

// Hook for exit intent functionality
export function useExitIntent({
  onExitIntent,
  delay = 5000,
  sensitivity = 20,
  enabled = true,
}: {
  onExitIntent: () => void;
  delay?: number;
  sensitivity?: number;
  enabled?: boolean;
}) {
  const hasTriggered = useRef(false);
  const canTrigger = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Enable after delay
    const timer = setTimeout(() => {
      canTrigger.current = true;
    }, delay);

    const handleMouseLeave = (e: MouseEvent) => {
      if (canTrigger.current && e.clientY <= sensitivity && !hasTriggered.current) {
        hasTriggered.current = true;
        onExitIntent();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onExitIntent, delay, sensitivity, enabled]);

  return { hasTriggered: hasTriggered.current };
}

// Component for scroll-based newsletter triggers
export function ScrollTrigger({
  children,
  percentage = 70,
  enabled = true,
}: {
  children: React.ReactNode;
  percentage?: number;
  enabled?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleScroll = () => {
      if (hasTriggered.current) return;

      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollTop / docHeight) * 100;

      if (scrollPercentage >= percentage) {
        hasTriggered.current = true;
        setIsModalOpen(true);

        // Track scroll trigger
        const sessionId =
          document.cookie
            .split('; ')
            .find((row) => row.startsWith('session_id='))
            ?.split('=')[1] || '';

        trackNewsletterEvent('view', sessionId, 'modal', {
          scrollTrigger: true,
          scrollPercentage,
          trigger: 'scroll',
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [percentage, enabled]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {children}

      <OptInModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        trigger="scroll"
        title="Lieben Sie KI-Inhalte?"
        description="Da Sie so weit gelesen haben, interessieren Sie sich offensichtlich für KI. Lassen Sie sich die neuesten Entwicklungen nicht entgehen!"
        incentive="📚 Bonus: Zugang zu unserem exklusiven KI-Ressourcen-Bereich"
      />
    </>
  );
}

// Time-based trigger component
export function TimeTrigger({
  children,
  delay = 30000, // 30 seconds
  enabled = true,
}: {
  children: React.ReactNode;
  delay?: number;
  enabled?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      setIsModalOpen(true);

      // Track time trigger
      const sessionId =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith('session_id='))
          ?.split('=')[1] || '';

      trackNewsletterEvent('view', sessionId, 'modal', {
        timeTrigger: true,
        trigger: 'time',
        delay,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, enabled]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {children}

      <OptInModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        trigger="time"
        title="Moment! Bevor Sie gehen..."
        description="Sie lesen schon seit einer Weile. Verpassen Sie nicht unsere wöchentlichen KI-Insights!"
        incentive="⏰ Zeitersparnis: Alle wichtigen KI-News in 5 Minuten"
      />
    </>
  );
}
