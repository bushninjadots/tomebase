'use client';

import { motion } from 'framer-motion';
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

export function SpiritGhost({ state, size = 'medium', className = '' }: SpiritGhostProps) {
  const px = SIZE_MAP[size];
  const viewBox = 120;

  return (
    <motion.svg
      width={px}
      height={px * 1.2}
      viewBox={`0 0 ${viewBox} ${viewBox * 1.2}`}
      fill="none"
      className={className}
      initial={false}
      animate={state}
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
        cx={viewBox / 2}
        cy={viewBox / 2}
        r={viewBox * 0.35}
        fill="currentColor"
        filter="url(#ghost-blur)"
        variants={glowVariants}
        className="text-theme-accent/20"
      />

      {/* Ghost body */}
      <motion.path
        d={`M${viewBox * 0.5} ${viewBox * 0.08}
            C${viewBox * 0.75} ${viewBox * 0.08} ${viewBox * 0.92} ${viewBox * 0.28} ${viewBox * 0.92} ${viewBox * 0.55}
            C${viewBox * 0.92} ${viewBox * 0.75} ${viewBox * 0.88} ${viewBox * 0.88} ${viewBox * 0.88} ${viewBox * 0.88}
            C${viewBox * 0.88} ${viewBox * 0.88} ${viewBox * 0.75} ${viewBox * 0.75} ${viewBox * 0.62} ${viewBox * 0.88}
            L${viewBox * 0.62} ${viewBox * 0.75}
            C${viewBox * 0.55} ${viewBox * 0.88} ${viewBox * 0.45} ${viewBox * 0.88} ${viewBox * 0.38} ${viewBox * 0.75}
            L${viewBox * 0.38} ${viewBox * 0.88}
            C${viewBox * 0.25} ${viewBox * 0.75} ${viewBox * 0.12} ${viewBox * 0.88} ${viewBox * 0.12} ${viewBox * 0.88}
            C${viewBox * 0.12} ${viewBox * 0.88} ${viewBox * 0.08} ${viewBox * 0.75} ${viewBox * 0.08} ${viewBox * 0.55}
            C${viewBox * 0.08} ${viewBox * 0.28} ${viewBox * 0.25} ${viewBox * 0.08} ${viewBox * 0.5} ${viewBox * 0.08}Z`}
        fill="url(#ghost-grad)"
        className="text-theme-main"
      />

      {/* Eyes */}
      <motion.g variants={eyeVariants}>
        <circle
          cx={viewBox * 0.38}
          cy={viewBox * 0.42}
          r={viewBox * 0.035}
          className="fill-theme-page"
        />
        <circle
          cx={viewBox * 0.62}
          cy={viewBox * 0.42}
          r={viewBox * 0.035}
          className="fill-theme-page"
        />
      </motion.g>

      {/* Eye glow */}
      <motion.circle
        cx={viewBox * 0.38}
        cy={viewBox * 0.42}
        r={viewBox * 0.055}
        fill="currentColor"
        className="text-theme-accent"
        variants={glowVariants}
        opacity={0.2}
      />
      <motion.circle
        cx={viewBox * 0.62}
        cy={viewBox * 0.42}
        r={viewBox * 0.055}
        fill="currentColor"
        className="text-theme-accent"
        variants={glowVariants}
        opacity={0.2}
      />
    </motion.svg>
  );
}
