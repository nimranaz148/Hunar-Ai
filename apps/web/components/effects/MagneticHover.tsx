"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface MagneticHoverProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function MagneticHover({
  children,
  strength = 0.4,
  className = "",
}: MagneticHoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      gsap.to(element, {
        x: deltaX * strength,
        y: deltaY * strength,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.5)",
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
