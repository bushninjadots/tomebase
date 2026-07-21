'use client';

import { useState, useRef, useEffect } from 'react';

export function useSplitResize(
  splitRef: React.RefObject<HTMLDivElement | null>,
  splitDividerRef: React.RefObject<HTMLDivElement | null>,
  viewMode: string
) {
  const [splitPosition, setSplitPosition] = useState(50);
  const splitPositionRef = useRef(splitPosition);
  splitPositionRef.current = splitPosition;

  // Split view drag
  useEffect(() => {
    const divider = splitDividerRef.current;
    if (!divider || viewMode !== 'split') return;
    let startX = 0;
    let startPct = 0;

    function onMouseDown(e: MouseEvent) {
      e.preventDefault();
      startX = e.clientX;
      startPct = splitPositionRef.current;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(e: MouseEvent) {
      const container = splitRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = startPct + ((e.clientX - startX) / rect.width) * 100;
      setSplitPosition(Math.min(Math.max(pct, 25), 75));
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    divider.addEventListener('mousedown', onMouseDown);
    return () => divider.removeEventListener('mousedown', onMouseDown);
  }, [viewMode, splitRef, splitDividerRef]);

  return { splitPosition, splitPositionRef };
}
