'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSpiritStore } from '@fluid/spirit';
import { SpiritGhost } from './spirit-ghost';
import { SpiritWindow } from './spirit-window';

const BUBBLE_SIZE = 56;
const MARGIN = 20;
const DRAG_THRESHOLD = 5;

export function SpiritBubble() {
  const { position, setPosition, aiState, toggle } = useSpiritStore();
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

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

  const handleDragStart = useCallback(() => {
    dragStart.current = { x: position.x, y: position.y };
    didDrag.current = false;
  }, [position.x, position.y]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number; y: number } }) => {
      const { x, y } = info.point;
      const maxX = window.innerWidth - BUBBLE_SIZE - MARGIN;
      const maxY = window.innerHeight - BUBBLE_SIZE - MARGIN;
      const newX = Math.max(MARGIN, Math.min(x - BUBBLE_SIZE / 2, maxX));
      const newY = Math.max(MARGIN, Math.min(y - BUBBLE_SIZE / 2, maxY));

      if (dragStart.current) {
        const dx = newX - dragStart.current.x;
        const dy = newY - dragStart.current.y;
        didDrag.current = Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD;
      }

      dragStart.current = null;
      setPosition({ x: newX, y: newY });
    },
    [setPosition],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!didDrag.current) toggle();
    },
    [toggle],
  );

  const windowWidth = 400;
  const showLeft = position.x + BUBBLE_SIZE + windowWidth + MARGIN < window.innerWidth;

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isHovered ? 1.12 : 1,
          opacity: 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          cursor: 'grab',
          left: position.x,
          top: position.y,
        }}
        className="select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="spirit-float">
          <div
            className={`relative flex items-center justify-center rounded-2xl bg-theme-card shadow-lg transition-all duration-300 ${
              isHovered ? 'shadow-xl border-theme-accent/50' : 'border-theme-accent/20'
            } border-2`}
            style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
          >
            <SpiritGhost state={aiState} size="medium" />
            {aiState === 'thinking' && (
              <div className="absolute inset-0 rounded-2xl spirit-pulse-ring" />
            )}
          </div>
        </div>
      </motion.div>

      <SpiritWindow
        position={position}
        bubbleSize={BUBBLE_SIZE}
        showLeft={showLeft}
      />
    </>
  );
}
