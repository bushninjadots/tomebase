'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSpiritStore, DEFAULT_POSITION } from '@fluid/spirit';
import { SpiritGhost } from './spirit-ghost';
import { SpiritWindow } from './spirit-window';
import { SpiritBubbleComment } from './spirit-bubble-comment';
import { SpiritSpeechBubble } from './spirit-speech-bubble';
import { useSpiritMovement } from './hooks/use-spirit-movement';

const BUBBLE_SIZE = 56;
const MARGIN = 20;
const DRAG_THRESHOLD = 5;
const THROW_QUIP_THRESHOLD = 8;
const THROW_QUIPS = [
  "Whoa!",
  "I definitely meant to do that.",
  "10/10 landing.",
  "Wheee!",
  "That was on purpose.",
  "Nailed it.",
];
const VELOCITY_TRACK_FRAMES = 5;

interface SpiritBubbleProps {
  projectId?: string;
}

export function SpiritBubble({ projectId }: SpiritBubbleProps) {
  const { position, setPosition, aiState, toggle, mode } = useSpiritStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const didDrag = useRef(false);
  const initialized = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const velocityFramesRef = useRef<{ dx: number; dy: number; dt: number }[]>([]);

  useSpiritMovement({ bubbleRef, enabled: mode === 'floating', isDragging });

  // On first mount: if position is still the static default, recompute to bottom-right
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (
      position.x === DEFAULT_POSITION.x &&
      position.y === DEFAULT_POSITION.y
    ) {
      setPosition({
        x: window.innerWidth - BUBBLE_SIZE - MARGIN,
        y: window.innerHeight - BUBBLE_SIZE - MARGIN,
      });
    }
  }, [position.x, position.y, setPosition]);

  // Clamp position to viewport on resize
  useEffect(() => {
    function clamp() {
      const maxX = window.innerWidth - BUBBLE_SIZE - MARGIN;
      const maxY = window.innerHeight - BUBBLE_SIZE - MARGIN;
      const { x, y } = useSpiritStore.getState().position;
      const clampedX = Math.max(MARGIN, Math.min(x, maxX));
      const clampedY = Math.max(MARGIN, Math.min(y, maxY));
      if (clampedX !== x || clampedY !== y) {
        setPosition({ x: clampedX, y: clampedY });
      }
    }
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [setPosition]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = bubbleRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);

    const store = useSpiritStore.getState();
    store.setWandering(false);
    store.setTarget(null);
    store.setLastActivity(Date.now());

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: store.position.x,
      posY: store.position.y,
    };
    didDrag.current = false;
    velocityFramesRef.current = [];
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const { x: startX, y: startY, posX, posY } = dragStartRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!didDrag.current && Math.sqrt(dx * dx + dy * dy) <= DRAG_THRESHOLD) return;
    didDrag.current = true;

    const now = performance.now();
    const frames = velocityFramesRef.current;
    if (frames.length > 0) {
      const prev = frames[frames.length - 1];
      const dt = now - (prev as unknown as { time: number }).time || 16;
      frames.push({ dx: e.movementX, dy: e.movementY, dt });
    } else {
      frames.push({ dx: e.movementX, dy: e.movementY, dt: 16 } as unknown as { dx: number; dy: number; dt: number } & { time: number });
    }
    // Attach timestamp for next frame's dt calc
    (frames[frames.length - 1] as unknown as { time: number }).time = now;
    if (frames.length > VELOCITY_TRACK_FRAMES) frames.shift();

    const maxX = window.innerWidth - BUBBLE_SIZE - MARGIN;
    const maxY = window.innerHeight - BUBBLE_SIZE - MARGIN;
    setPosition({
      x: Math.max(MARGIN, Math.min(posX + dx, maxX)),
      y: Math.max(MARGIN, Math.min(posY + dy, maxY)),
    });
  }, [setPosition]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const el = bubbleRef.current;
    if (el) el.releasePointerCapture(e.pointerId);

    if (didDrag.current) {
      const frames = velocityFramesRef.current;
      if (frames.length > 0) {
        let totalDx = 0;
        let totalDy = 0;
        let totalDt = 0;
        for (const f of frames) {
          totalDx += f.dx;
          totalDy += f.dy;
          totalDt += f.dt;
        }
        if (totalDt > 0) {
          const vx = (totalDx / totalDt) * 16;
          const vy = (totalDy / totalDt) * 16;
          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed > 2) {
            useSpiritStore.getState().setMovement({
              velocity: { x: vx, y: vy },
            });
            if (speed > THROW_QUIP_THRESHOLD) {
              const quip = THROW_QUIPS[Math.floor(Math.random() * THROW_QUIPS.length)] ?? 'Wheee!';
              useSpiritStore.getState().addSpeechBubble({
                text: quip,
                variant: 'reaction',
                duration: 3000,
              });
            }
          }
        }
      }
    }

    dragStartRef.current = null;
    velocityFramesRef.current = [];
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!didDrag.current) toggle();
  }, [toggle]);

  const windowWidth = 400;
  const showLeft =
    position.x + BUBBLE_SIZE + windowWidth + MARGIN < window.innerWidth;

  return (
    <>
      <motion.div
        ref={bubbleRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isHovered ? 1.12 : 1,
          opacity: 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          left: position.x,
          top: position.y,
        }}
        className="select-none spirit-breathing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div
          className={`relative flex items-center justify-center rounded-2xl bg-theme-card shadow-lg transition-all duration-300 ${
            isHovered
              ? 'shadow-xl border-theme-accent/50'
              : 'border-theme-accent/20'
          } border-2`}
          style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
        >
          <SpiritGhost state={aiState} size="medium" />
          {aiState === 'thinking' && (
            <div className="absolute inset-0 rounded-2xl spirit-pulse-ring" />
          )}
        </div>
      </motion.div>

      <SpiritSpeechBubble />
      <SpiritWindow
        position={position}
        bubbleSize={BUBBLE_SIZE}
        showLeft={showLeft}
        projectId={projectId}
      />
      <SpiritBubbleComment />
    </>
  );
}
