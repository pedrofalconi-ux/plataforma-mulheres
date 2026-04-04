'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const INTERACTIVE_SELECTOR = [
  '.motion-card',
  '.motion-button',
  '.motion-tab',
  '.glass-panel',
  '.soft-card',
  '.hero-sheen',
].join(', ');

export function PointerEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(pointer: fine)');

    const setRootPointer = (clientX: number, clientY: number) => {
      root.style.setProperty('--pointer-x', `${clientX}px`);
      root.style.setProperty('--pointer-y', `${clientY}px`);
    };

    const attachInteractiveEffects = () => {
      if (!mediaQuery.matches) return () => {};

      const elements = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR));

      const cleanups = elements.map((element) => {
        const handleMove = (event: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          element.style.setProperty('--mx', `${x}px`);
          element.style.setProperty('--my', `${y}px`);
          element.style.setProperty('--rx', `${((y / rect.height) - 0.5) * -5}deg`);
          element.style.setProperty('--ry', `${((x / rect.width) - 0.5) * 6}deg`);
          element.dataset.pointer = 'active';
        };

        const handleLeave = () => {
          element.style.setProperty('--rx', '0deg');
          element.style.setProperty('--ry', '0deg');
          element.dataset.pointer = 'idle';
        };

        element.classList.add('pointer-reactive');
        element.dataset.pointer = 'idle';
        element.addEventListener('mousemove', handleMove);
        element.addEventListener('mouseleave', handleLeave);

        return () => {
          element.removeEventListener('mousemove', handleMove);
          element.removeEventListener('mouseleave', handleLeave);
          element.classList.remove('pointer-reactive');
          delete element.dataset.pointer;
        };
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    };

    const handleWindowMove = (event: MouseEvent) => {
      setRootPointer(event.clientX, event.clientY);
      root.classList.add('pointer-enhanced');
    };

    const handleTouchStart = () => {
      root.classList.remove('pointer-enhanced');
    };

    setRootPointer(window.innerWidth / 2, window.innerHeight / 3);
    window.addEventListener('mousemove', handleWindowMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    const cleanupInteractive = attachInteractiveEffects();

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('touchstart', handleTouchStart);
      cleanupInteractive();
    };
  }, [pathname]);

  return null;
}
