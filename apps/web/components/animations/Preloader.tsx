"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [isComplete, setIsComplete] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftMascotRef = useRef<HTMLDivElement>(null);
  const rightMascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if preloader was already shown
    const hasSeenPreloader = sessionStorage.getItem("preloader_seen");

    if (hasSeenPreloader) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const counter = counterRef.current;
    const container = containerRef.current;
    const leftMascot = leftMascotRef.current;
    const rightMascot = rightMascotRef.current;

    if (!counter || !container) return;

    // Counter animation object
    const counterObj = { value: 0 };

    // Create timeline
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("preloader_seen", "true");
        setIsComplete(true);
        onComplete?.();
      },
    });

    // Mascots slide in from sides
    if (leftMascot && rightMascot) {
      tl.from(
        [leftMascot, rightMascot],
        {
          x: (index) => (index === 0 ? -200 : 200),
          opacity: 0,
          duration: 0.8,
          ease: "back.out(2.2)",
        },
        0
      );
    }

    // Counter animation 0-100%
    tl.to(
      counterObj,
      {
        value: 100,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counter) {
            counter.textContent = Math.floor(counterObj.value).toString();
          }
        },
      },
      0.3
    );

    // Shrink and fade out
    tl.to(container, {
      scale: 0.9,
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  if (isComplete) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
      style={{ transformOrigin: "center" }}
    >
      <div className="relative">
        {/* Left Mascot */}
        <div
          ref={leftMascotRef}
          className="absolute -left-32 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-purple to-pink opacity-80"
        />

        {/* Counter */}
        <div className="text-center">
          <div
            ref={counterRef}
            className="text-9xl font-black text-gradient-purple mb-4"
            style={{
              fontVariantNumeric: "tabular-nums",
            }}
          >
            0
          </div>
          <div className="text-2xl font-bold text-[#64748b] tracking-wide">
            %
          </div>
        </div>

        {/* Right Mascot */}
        <div
          ref={rightMascotRef}
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-pink to-purple opacity-80"
        />
      </div>
    </div>
  );
}
