"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  durationMs = 900,
  decimals = 0,
  className,
}: {
  value: number;
  durationMs?: number;
  decimals?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      // Ease-out cubic — fast start, gentle settle, feels like an impact.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}
