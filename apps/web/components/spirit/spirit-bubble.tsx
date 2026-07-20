'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSpiritStore, DEFAULT_POSITION } from '@fluid/spirit';
import { SpiritGhost } from './spirit-ghost';
import { SpiritWindow } from './spirit-window';

const BUBBLE_SIZE = 56;
const MARGIN = 20;
const DRAG_THRESHOLD = 5;

export function SpiritBubble() {
  const { position, setPosition, aiState, toggle } = useSpiritStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const didDrag = useRef(false);
  const initialized = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

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

  // Manual pointer-based drag — no framer-motion transform conflicts
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = bubbleRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: useSpiritStore.getState().position.x,
      posY: useSpiritStore.getState().position.y,
    };
    didDrag.current = false;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const { x: startX, y: startY, posX, posY } = dragStartRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!didDrag.current && Math.sqrt(dx * dx + dy * dy) <= DRAG_THRESHOLD) return;
    didDrag.current = true;

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
    dragStartRef.current = null;
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
        className="select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="spirit-float">
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
