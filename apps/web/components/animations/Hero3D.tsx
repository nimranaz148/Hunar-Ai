"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const heading = headingRef.current;
    const subheading = subheadingRef.current;
    const cta = ctaRef.current;
    const accent = accentRef.current;

    // Create timeline for entrance animations
    const tl = gsap.timeline();

    tl.from(heading, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
    })
      .from(
        subheading,
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6"
      )
      .from(
        cta,
        {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      );

    // Animate accent line
    if (accent) {
      gsap.from(accent, {
        scaleX: 0,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.3,
      });
    }

    // Subtle parallax effect on scroll
    if (heading && subheading && cta) {
      gsap.to(heading, {
        y: -100,
        opacity: 0.3,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(subheading, {
        y: -70,
        opacity: 0,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(cta, {
        y: -50,
        opacity: 0,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Subtle accent element - single purposeful use of purple */}
      <span className="absolute top-32 right-0 w-px h-96 bg-purple origin-top opacity-30 block" ref={accentRef} />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        {/* Main heading - bold, large, confident */}
        <h1
          ref={headingRef}
          className="text-7xl sm:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tight"
        >
          <span className="block text-[#0f172a]">
            Transform Your
          </span>
          <span className="block text-[#0f172a] mt-4">
            Home <span className="text-purple inline-block">Business</span>
          </span>
        </h1>

        {/* Subheading - generous spacing */}
        <p
          ref={subheadingRef}
          className="text-xl sm:text-2xl text-[#64748b] max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
        >
          AI-powered platform built for Pakistani women entrepreneurs.
          <br />
          Business planning to first sale in 30 days — all in Roman Urdu.
        </p>

        {/* CTA buttons - clean, purposeful */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
        >
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-3 group"
          >
            <span>Start Your Business</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="btn-outline inline-flex items-center gap-3"
          >
            <Play className="w-4 h-4" />
            <span>Watch Demo</span>
          </Link>
        </div>

        {/* Stats - clean, minimal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 max-w-5xl mx-auto border-t border-[#e5e7eb] pt-12">
          <div>
            <div className="text-5xl font-black text-[#0f172a] mb-2">500<span className="text-purple">+</span></div>
            <div className="text-sm text-[#64748b] font-medium uppercase tracking-wide">Entrepreneurs</div>
          </div>
          <div>
            <div className="text-5xl font-black text-[#0f172a] mb-2">50<span className="text-pink">+</span></div>
            <div className="text-sm text-[#64748b] font-medium uppercase tracking-wide">Mentors</div>
          </div>
          <div>
            <div className="text-5xl font-black text-[#0f172a] mb-2">10<span className="text-purple">K+</span></div>
            <div className="text-sm text-[#64748b] font-medium uppercase tracking-wide">Posts Created</div>
          </div>
          <div>
            <div className="text-5xl font-black text-[#0f172a] mb-2">₨2<span className="text-pink">M+</span></div>
            <div className="text-sm text-[#64748b] font-medium uppercase tracking-wide">Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
