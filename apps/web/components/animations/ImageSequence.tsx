"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ImageSequenceProps {
  className?: string;
}

export function ImageSequence({ className = "" }: ImageSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1920;
    canvas.height = 1080;

    // Simulate image sequence with gradient frames
    const frameCount = 150;
    let currentFrame = 0;

    const drawFrame = (frame: number) => {
      const progress = frame / frameCount;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create animated gradient based on frame
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width * progress,
        canvas.height * progress
      );

      gradient.addColorStop(0, `hsl(${280 + progress * 40}, 70%, ${50 + progress * 20}%)`);
      gradient.addColorStop(0.5, `hsl(${300 + progress * 30}, 80%, ${60 + progress * 10}%)`);
      gradient.addColorStop(1, `hsl(${320 + progress * 20}, 75%, ${55 + progress * 15}%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add animated shapes
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 200 + progress * 300;

      // Draw circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + progress * 0.3})`;
      ctx.fill();

      // Draw smaller circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + progress * 0.4})`;
      ctx.fill();

      // Add text
      ctx.font = `bold ${60 + progress * 40}px sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Hunar v2", centerX, centerY);

      ctx.font = `${24 + progress * 16}px sans-serif`;
      ctx.fillText("AI-Powered Business Growth", centerX, centerY + 80);
    };

    // Initial draw
    drawFrame(0);

    // ScrollTrigger animation
    const animation = gsap.to({}, {
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: true,
        pin: true,
        onUpdate: (self) => {
          const frame = Math.floor(self.progress * frameCount);
          if (frame !== currentFrame) {
            currentFrame = frame;
            drawFrame(frame);
          }
        },
      },
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === container) {
          trigger.kill();
        }
      });
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}
