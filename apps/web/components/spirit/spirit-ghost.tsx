'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { SpiritAIState, SpiritGhostSize } from '@fluid/spirit';

const SIZE_MAP: Record<SpiritGhostSize, number> = {
  small: 32,
  medium: 48,
  large: 64,
};

interface SpiritGhostProps {
  state: SpiritAIState;
  size?: SpiritGhostSize;
  className?: string;
  squash?: { x: number; y: number };
}

const eyeVariants = {
  idle: { scaleY: 1 },
  sleeping: { scaleY: 0.1, transition: { duration: 0.3 } },
  thinking: { scaleY: 1, scaleX: 0.8 },
  responding: { scaleY: 1, scaleX: 1.1 },
  reading: { scaleY: 0.9 },
  warning: { scaleY: 1 },
};

const glowVariants = {
  idle: { opacity: 0.3, scale: 1 },
  sleeping: { opacity: 0.1, scale: 0.8 },
  thinking: { opacity: 0.5, scale: 1.3 },
  responding: { opacity: 0.6, scale: 1.4 },
  reading: { opacity: 0.3, scale: 1 },
  warning: { opacity: 0.8, scale: 1.5 },
  publishing: { opacity: 0.7, scale: 1.2 },
  offline: { opacity: 0.1, scale: 0.9 },
  error: { opacity: 0.4, scale: 1.2 },
};

const bodyPath =
  'M50 6 C70 6 88 22 88 48 C88 68 85 80 85 80 C85 80 72 70 62 80 L62 70 C55 80 45 80 38 70 L38 80 C28 70 15 80 15 80 C15 80 12 68 12 48 C12 22 30 6 50 6Z';

export function SpiritGhost({
  state,
  size = 'medium',
  className = '',
  squash,
}: SpiritGhostProps) {
  const px = SIZE_MAP[size];
  const eyeControls = useAnimationControls();
  const blinkRunningRef = useRef(false);

  useEffect(() => {
    if (state === 'idle') {
      blinkRunningRef.current = true;
      const runBlink = async () => {
        while (blinkRunningRef.current) {
          const delay = 4000 + Math.random() * 2000;
          await new Promise((r) => setTimeout(r, delay));
          if (!blinkRunningRef.current) break;
          await eyeControls.start({
            scaleY: 0.1,
            transition: { duration: 0.1 },
          });
          await eyeControls.start({
            scaleY: 1,
            transition: { duration: 0.1 },
          });
        }
      };
      runBlink();
    } else {
      blinkRunningRef.current = false;
      eyeControls.stop();
      eyeControls.set({ scaleY: 1, scaleX: 1 });
    }

    return () => {
      blinkRunningRef.current = false;
    };
  }, [state, eyeControls]);

  return (
    <motion.svg
      width={px}
      height={px * 1.3}
      viewBox="0 0 100 130"
      fill="none"
      className={className}
      initial={false}
      animate={state}
      style={{
        transform: `scaleX(${squash?.x ?? 1}) scaleY(${squash?.y ?? 1})`,
      }}
    >
      <defs>
        <linearGradient id="ghost-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <filter id="ghost-blur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Glow behind ghost */}
      <motion.circle
        cx={50}
        cy={65}
        r={35}
        fill="currentColor"
        filter="url(#ghost-blur)"
        variants={glowVariants}
        className="text-theme-accent/20"
      />

      {/* Ghost body */}
      <motion.path
        d={bodyPath}
        fill="url(#ghost-grad)"
        className="text-theme-accent"
        animate={{
          scaleY: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '50% 50%' }}
      />

      {/* Eyes */}
      <motion.g variants={eyeVariants} animate={eyeControls}>
        <circle
          cx={35}
          cy={52}
          r={4}
          className="fill-theme-page"
        />
        <circle
          cx={65}
          cy={52}
          r={4}
          className="fill-theme-page"
        />
      </motion.g>

      {/* Eye glow */}
      <motion.circle
        cx={35}
        cy={52}
        r={5.5}
        fill="currentColor"
        className="text-theme-accent"
        variants={glowVariants}
        opacity={0.2}
      />
      <motion.circle
        cx={65}
        cy={52}
        r={5.5}
        fill="currentColor"
        className="text-theme-accent"
        variants={glowVariants}
        opacity={0.2}
      />
    </motion.svg>
  );
}
