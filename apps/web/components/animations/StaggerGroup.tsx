"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface StaggerGroupProps {
  children: React.ReactNode;
  stagger?: number;
  from?: "top" | "bottom" | "left" | "right" | "center";
  className?: string;
}

export function StaggerGroup({
  children,
  stagger = 0.1,
  from = "bottom",
  className = "",
}: StaggerGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const childElements = Array.from(element.children);

    const initial: gsap.TweenVars = {
      opacity: 0,
    };

    switch (from) {
      case "top":
        initial.y = -50;
        break;
      case "bottom":
        initial.y = 50;
        break;
      case "left":
        initial.x = -50;
        break;
      case "right":
        initial.x = 50;
        break;
      case "center":
        initial.scale = 0.8;
        break;
    }

    gsap.set(childElements, initial);

    const animation = gsap.to(childElements, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: 0.6,
      stagger,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        toggleActions: "play none none none",
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
  }, [stagger, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
