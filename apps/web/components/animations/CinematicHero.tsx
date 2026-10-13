"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const subheading = subheadingRef.current;
    const cta = ctaRef.current;

    if (!heading) return;

    // Simple, purposeful entrance animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(heading, {
      y: 60,
      opacity: 0,
      duration: 1.2,
    })
      .from(
        subheading,
        {
          y: 30,
          opacity: 0,
          duration: 0.9,
        },
        "-=0.6"
      )
      .from(
        cta,
        {
          y: 20,
          opacity: 0,
          duration: 0.7,
        },
        "-=0.4"
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Subtle background video - not competing with typography */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        >
          <source src="/Abstract_3D_animation_for_website_20261012191704.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/40" />
      </div>

      {/* Content - Typography is the hero */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 text-center">
        {/* Statement headline - Bold, confident, restrained */}
        <h1
          ref={headingRef}
          className="text-[80px] sm:text-[120px] lg:text-[160px] font-black leading-[0.9] tracking-[-0.03em] text-[#0f172a] mb-8"
        >
          Transform Your
          <br />
          Home{" "}
          <span className="text-[#a855f7]">Business</span>
        </h1>

        {/* Minimal subheading */}
        <p
          ref={subheadingRef}
          className="text-[18px] sm:text-[20px] text-[#64748b] max-w-[600px] mx-auto mb-12 leading-relaxed font-normal"
        >
          AI-powered platform for Pakistani women entrepreneurs.
          <br />
          From idea to first sale in 30 days.
        </p>

        {/* Single, purposeful CTA */}
        <div ref={ctaRef}>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-[#0f172a] text-white px-10 py-5 rounded-[14px] text-[16px] font-semibold hover:bg-[#1e293b] transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg"
          >
            Start Your Business
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
