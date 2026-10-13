"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollVideoProps {
  src: string;
  className?: string;
  autoplay?: boolean;
}

export function ScrollVideo({ src, className = "", autoplay = false }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Handle video load and autoplay
    const handleLoadedMetadata = () => {
      if (autoplay) {
        video.play().catch(err => console.log("Autoplay prevented:", err));
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (autoplay) {
      // Loop autoplay video in viewport
      ScrollTrigger.create({
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => video.play().catch(err => console.log(err)),
        onLeave: () => video.pause(),
        onEnterBack: () => video.play().catch(err => console.log(err)),
        onLeaveBack: () => video.pause(),
      });
    } else {
      // Scroll-controlled video playback
      ScrollTrigger.create({
        trigger: container,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1,
        onUpdate: (self) => {
          if (video.duration && !isNaN(video.duration)) {
            const newTime = video.duration * self.progress;
            video.currentTime = newTime;
          }
        },
      });
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) {
          st.kill();
        }
      });
    };
  }, [src, autoplay]);

  return (
    <div ref={containerRef} className={`${className} relative overflow-hidden rounded-3xl`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
