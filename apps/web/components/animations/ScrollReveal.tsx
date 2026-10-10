"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "scale" | "fade";
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 1,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    // Set initial state based on direction
    const initial: gsap.TweenVars = {
      opacity: 0,
    };

    switch (direction) {
      case "up":
        initial.y = 60;
        break;
      case "down":
        initial.y = -60;
        break;
      case "left":
        initial.x = 60;
        break;
      case "right":
        initial.x = -60;
        break;
      case "scale":
        initial.scale = 0.8;
        break;
    }

    gsap.set(element, initial);

    // Create scroll trigger animation
    const animation = gsap.to(element, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        end: "top 20%",
        toggleActions: "play none none reverse",
      },
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [direction, delay, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
