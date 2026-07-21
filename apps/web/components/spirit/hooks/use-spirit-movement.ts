'use client';

import { useEffect, useRef } from 'react';
import { useSpiritStore } from '@fluid/spirit';

const BUBBLE_SIZE = 56;
const MARGIN = 20;
const WANDER_RANGE = 200;
const IDLE_THRESHOLD_MS = 10_000;
const WANDER_COOLDOWN_MIN_MS = 3_000;
const WANDER_COOLDOWN_MAX_MS = 8_000;
const TARGET_REACHED_DIST = 5;
const CURSOR_LEAN_MAX_DEG = 8;
const BREATH_SPEED = 0.002;
const BREATH_AMOUNT = 0.02;
const STRETCH_FACTOR = 0.01;
const STRETCH_MAX = 0.15;
const VELOCITY_DAMPING = 0.95;
const VELOCITY_FORCE = 0.02;
const BOUNCE_DAMPING = 0.6;
const THROW_QUIP_THRESHOLD = 8;
const SCROLL_DECAY = 0.92;
const SCROLL_IMPULSE_FACTOR = 0.3;

interface UseSpiritMovementOptions {
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
  isDragging: boolean;
}

function clampToViewport(x: number, y: number) {
  const maxX = window.innerWidth - BUBBLE_SIZE - MARGIN;
  const maxY = window.innerHeight - BUBBLE_SIZE - MARGIN;
  return {
    x: Math.max(MARGIN, Math.min(x, maxX)),
    y: Math.max(MARGIN, Math.min(y, maxY)),
  };
}

function bounceOffEdges(
  x: number,
  y: number,
  vx: number,
  vy: number,
): { x: number; y: number; vx: number; vy: number } {
  const maxX = window.innerWidth - BUBBLE_SIZE - MARGIN;
  const maxY = window.innerHeight - BUBBLE_SIZE - MARGIN;
  let newVx = vx;
  let newVy = vy;
  let newX = x;
  let newY = y;

  if (newX <= MARGIN) {
    newX = MARGIN;
    newVx = Math.abs(newVx) * BOUNCE_DAMPING;
  } else if (newX >= maxX) {
    newX = maxX;
    newVx = -Math.abs(newVx) * BOUNCE_DAMPING;
  }
  if (newY <= MARGIN) {
    newY = MARGIN;
    newVy = Math.abs(newVy) * BOUNCE_DAMPING;
  } else if (newY >= maxY) {
    newY = maxY;
    newVy = -Math.abs(newVy) * BOUNCE_DAMPING;
  }
  return { x: newX, y: newY, vx: newVx, vy: newVy };
}

function randomInRange(center: number, range: number, min: number, max: number) {
  const target = center + (Math.random() - 0.5) * 2 * range;
  return Math.max(min, Math.min(target, max));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function useSpiritMovement({
  bubbleRef,
  enabled,
  isDragging,
}: UseSpiritMovementOptions) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const scrollVelocityRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const velocityRef = useRef({ x: 0, y: 0 });
  const wanderTargetRef = useRef<{ x: number; y: number } | null>(null);
  const wanderCooldownRef = useRef(0);
  const mouseRafPendingRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const isDraggingRef = useRef(isDragging);

  isDraggingRef.current = isDragging;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function onMouseMove(e: MouseEvent) {
      if (!mouseRafPendingRef.current) {
        mouseRafPendingRef.current = true;
        requestAnimationFrame(() => {
          mousePosRef.current = { x: e.clientX, y: e.clientY };
          lastActivityRef.current = Date.now();
          mouseRafPendingRef.current = false;
        });
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    function onWheel(e: WheelEvent) {
      if (prefersReducedMotionRef.current) return;
      scrollVelocityRef.current += e.deltaY * SCROLL_IMPULSE_FACTOR;
      lastActivityRef.current = Date.now();
    }

    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    function tick(time: number) {
      const dt = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;

      const store = useSpiritStore.getState();
      const { position, setPosition, isOpen } = store;
      const reducedMotion = prefersReducedMotionRef.current;

      if (isOpen || isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      let targetX = position.x;
      let targetY = position.y;
      const vel = velocityRef.current;
      const mouse = mousePosRef.current;

      const idleTime = Date.now() - lastActivityRef.current;
      if (
        !reducedMotion &&
        idleTime > IDLE_THRESHOLD_MS &&
        !wanderTargetRef.current
      ) {
        if (wanderCooldownRef.current <= 0) {
          wanderTargetRef.current = {
            x: randomInRange(
              position.x,
              WANDER_RANGE,
              MARGIN,
              window.innerWidth - BUBBLE_SIZE - MARGIN,
            ),
            y: randomInRange(
              position.y,
              WANDER_RANGE,
              MARGIN,
              window.innerHeight - BUBBLE_SIZE - MARGIN,
            ),
          };
        }
      }

      if (wanderTargetRef.current) {
        if (dist(position, wanderTargetRef.current) < TARGET_REACHED_DIST) {
          wanderTargetRef.current = null;
          wanderCooldownRef.current =
            WANDER_COOLDOWN_MIN_MS +
            Math.random() * (WANDER_COOLDOWN_MAX_MS - WANDER_COOLDOWN_MIN_MS);
        } else {
          targetX = wanderTargetRef.current.x;
          targetY = wanderTargetRef.current.y;
        }
      }

      if (wanderCooldownRef.current > 0) {
        wanderCooldownRef.current -= dt;
      }

      if (!reducedMotion) {
        vel.x += (targetX - position.x) * VELOCITY_FORCE;
        vel.y += (targetY - position.y) * VELOCITY_FORCE;
        vel.x *= VELOCITY_DAMPING;
        vel.y *= VELOCITY_DAMPING;
      }

      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      let newPos;
      if (speed > 1) {
        const bounced = bounceOffEdges(
          position.x + vel.x,
          position.y + vel.y,
          vel.x,
          vel.y,
        );
        newPos = { x: bounced.x, y: bounced.y };
        vel.x = bounced.vx;
        vel.y = bounced.vy;
      } else {
        newPos = clampToViewport(position.x + vel.x, position.y + vel.y);
      }
      setPosition(newPos);

      let cursorLean = 0;
      if (!reducedMotion) {
        const ghostCenterX = newPos.x + BUBBLE_SIZE / 2;
        const ghostCenterY = newPos.y + BUBBLE_SIZE / 2;
        const angle = Math.atan2(
          mouse.y - ghostCenterY,
          mouse.x - ghostCenterX,
        );
        cursorLean = Math.sin(angle) * CURSOR_LEAN_MAX_DEG;
        cursorLean = Math.max(
          -CURSOR_LEAN_MAX_DEG,
          Math.min(CURSOR_LEAN_MAX_DEG, cursorLean),
        );
      }

      let scrollBounce = scrollVelocityRef.current;
      scrollVelocityRef.current *= SCROLL_DECAY;
      if (Math.abs(scrollVelocityRef.current) < 0.1) {
        scrollVelocityRef.current = 0;
      }

      const breathScale = 1 + Math.sin(time * BREATH_SPEED) * BREATH_AMOUNT;

      let squashX = 1;
      let squashY = 1;
      if (!reducedMotion) {
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        if (speed > 0.1) {
          const stretch = Math.min(speed * STRETCH_FACTOR, STRETCH_MAX);
          const dirX = vel.x / speed;
          const dirY = vel.y / speed;
          squashX = 1 + stretch * Math.abs(dirX) - stretch * Math.abs(dirY);
          squashY = 1 + stretch * Math.abs(dirY) - stretch * Math.abs(dirX);
        }
      }

      const el = bubbleRef.current;
      if (el) {
        el.style.transform = `translateY(${scrollBounce}px) rotate(${cursorLean}deg) scaleX(${squashX}) scaleY(${squashY}) scale(${breathScale})`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, bubbleRef]);

  useEffect(() => {
    if (enabled) {
      lastActivityRef.current = Date.now();
      wanderCooldownRef.current = WANDER_COOLDOWN_MIN_MS;
    }
  }, [enabled]);
}
