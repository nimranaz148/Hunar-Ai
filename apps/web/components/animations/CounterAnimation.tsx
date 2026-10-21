"use client";

import { useEffect, useRef, useState } from "react";

interface CounterAnimationProps {
  value: string; // e.g., "500", "50", "10K", "₨2M"
  suffix?: string; // e.g., "+"
  duration?: number; // animation duration in ms
  className?: string;
  suffixClassName?: string;
}

export function CounterAnimation({
  value,
  suffix = "",
  duration = 2000,
  className = "",
  suffixClassName = "",
}: CounterAnimationProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Parse the value to extract number and any prefix/suffix in the value itself
  const parseValue = (val: string) => {
    // Handle currency symbols and letters
    const match = val.match(/^([₨$€£]?)(\d+(?:\.\d+)?)([KMB]?)$/);
    if (match) {
      const [, prefix, number, multiplier] = match;
      let numValue = parseFloat(number);

      // Convert K, M, B to actual numbers for animation
      if (multiplier === 'K') numValue *= 1000;
      else if (multiplier === 'M') numValue *= 1000000;
      else if (multiplier === 'B') numValue *= 1000000000;

      return { prefix, numValue, multiplier };
    }

    // Fallback - try to parse as number
    const numValue = parseFloat(val.replace(/[^0-9.]/g, ''));
    return { prefix: '', numValue: isNaN(numValue) ? 0 : numValue, multiplier: '' };
  };

  const { prefix, numValue, multiplier } = parseValue(value);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            // Animate the counter
            const startTime = Date.now();
            const startValue = 0;
            const endValue = multiplier ? parseFloat(value.replace(/[^0-9.]/g, '')) : numValue;

            const animate = () => {
              const currentTime = Date.now();
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Easing function (ease-out cubic)
              const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
              const easedProgress = easeOutCubic(progress);

              const currentValue = startValue + (endValue - startValue) * easedProgress;
              setCount(currentValue);

              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };

            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasAnimated, duration, numValue, multiplier, value]);

  // Format the display value
  const formatCount = () => {
    if (multiplier) {
      // Show simplified number with multiplier
      return `${prefix}${Math.floor(count)}${multiplier}`;
    } else {
      // Show full number
      return `${prefix}${Math.floor(count)}`;
    }
  };

  return (
    <div ref={elementRef} className={className}>
      {formatCount()}
      {suffix && <span className={suffixClassName}>{suffix}</span>}
    </div>
  );
}
