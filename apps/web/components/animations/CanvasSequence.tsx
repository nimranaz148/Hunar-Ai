"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CanvasSequenceProps {
  /**
   * Array of image URLs for the sequence
   */
  images: string[];
  /**
   * Width of the canvas
   */
  width?: number;
  /**
   * Height of the canvas
   */
  height?: number;
  /**
   * CSS class name
   */
  className?: string;
  /**
   * Start trigger for scroll animation
   */
  scrollStart?: string;
  /**
   * End trigger for scroll animation
   */
  scrollEnd?: string;
}

export function CanvasSequence({
  images,
  width = 1920,
  height = 1080,
  className = "",
  scrollStart = "top top",
  scrollEnd = "bottom top",
}: CanvasSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef({ value: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Preload all images
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    const onAllImagesLoaded = () => {
      imagesRef.current = loadedImages;

      // Draw first frame
      renderFrame(0);

      // Create scroll animation
      gsap.to(frameIndexRef.current, {
        value: images.length - 1,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: scrollStart,
          end: scrollEnd,
          scrub: 0.5,
          pin: true,
          onUpdate: (self) => {
            const frameIndex = Math.floor(
              self.progress * (images.length - 1)
            );
            renderFrame(frameIndex);
          },
        },
      });
    };

    const renderFrame = (index: number) => {
      const img = imagesRef.current[index];
      if (!img || !ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate aspect ratio fit
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > canvasAspect) {
        // Image is wider
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspect;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        // Image is taller
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspect;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Load images
    images.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === images.length) {
          onAllImagesLoaded();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        loadedCount++;
        if (loadedCount === images.length) {
          onAllImagesLoaded();
        }
      };
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) {
          st.kill();
        }
      });
    };
  }, [images, width, height, scrollStart, scrollEnd]);

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </div>
  );
}
