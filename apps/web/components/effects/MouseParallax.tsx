"use client";

import { useEffect, useRef } from "react";

export function MouseParallax({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const elements = container.querySelectorAll<HTMLElement>("[data-layer]");

      elements.forEach((el) => {
        const layer = parseFloat(el.getAttribute("data-layer") || "0");
        const rect = container.getBoundingClientRect();

        // Calculate mouse position relative to container center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Apply parallax based on layer depth
        const moveX = (deltaX * layer) / 20;
        const moveY = (deltaY * layer) / 20;

        // Repulsion effect (optional)
        const repRadius = 283; // pixels
        const distance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
        );

        if (distance < repRadius) {
          const repulse = (repRadius - distance) / repRadius;
          const angle = Math.atan2(deltaY, deltaX);
          const repulseX = Math.cos(angle) * repulse * 30;
          const repulseY = Math.sin(angle) * repulse * 30;

          el.style.transform = `translate(${moveX + repulseX}px, ${
            moveY + repulseY
          }px)`;
        } else {
          el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }

        el.style.transition = "transform 0.2s ease-out";
      });
    };

    const handleMouseLeave = () => {
      const elements = container.querySelectorAll<HTMLElement>("[data-layer]");
      elements.forEach((el) => {
        el.style.transform = "translate(0px, 0px)";
        el.style.transition = "transform 0.5s ease-out";
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  );
}
