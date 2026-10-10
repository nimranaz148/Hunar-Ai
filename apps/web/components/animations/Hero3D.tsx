"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const heading = headingRef.current;
    const subheading = subheadingRef.current;
    const cta = ctaRef.current;
    const floatingCards = floatingCardsRef.current;

    // Create timeline for entrance animations
    const tl = gsap.timeline();

    tl.from(heading, {
      y: 100,
      opacity: 0,
      scale: 0.9,
      duration: 1.2,
      ease: "power4.out",
    })
      .from(
        subheading,
        {
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6"
      )
      .from(
        cta,
        {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      );

    // Parallax effect on scroll
    if (heading && subheading && cta) {
      gsap.to(heading, {
        y: -150,
        scale: 0.8,
        opacity: 0,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(subheading, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(cta, {
        y: -80,
        opacity: 0,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // Floating cards animation
    if (floatingCards) {
      const cards = floatingCards.children;
      Array.from(cards).forEach((card, i) => {
        gsap.to(card, {
          y: "random(-50, 50)",
          x: "random(-30, 30)",
          rotation: "random(-5, 5)",
          duration: 3 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(card, {
          y: -200 - i * 50,
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl opacity-30 animate-float-shapes" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-400 rounded-full filter blur-3xl opacity-25 animate-float-shapes" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-float-shapes" style={{ animationDelay: "4s" }} />
      </div>

      {/* Floating cards in background */}
      <div ref={floatingCardsRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-64 h-40 glass rounded-2xl shadow-purple-lg" style={{ transform: "translateZ(-100px)" }}>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-purple mb-3" />
            <div className="h-3 bg-purple-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-purple-100 rounded w-1/2" />
          </div>
        </div>

        <div className="absolute top-40 right-[15%] w-56 h-36 glass rounded-2xl shadow-purple-md" style={{ transform: "translateZ(-150px)" }}>
          <div className="p-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-purple mb-3" />
            <div className="h-2.5 bg-pink-200 rounded w-2/3 mb-2" />
            <div className="h-2.5 bg-pink-100 rounded w-1/3" />
          </div>
        </div>

        <div className="absolute bottom-32 left-[20%] w-48 h-32 glass rounded-xl shadow-purple-md" style={{ transform: "translateZ(-120px)" }}>
          <div className="p-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-purple mb-2" />
            <div className="h-2 bg-purple-200 rounded w-full mb-1.5" />
            <div className="h-2 bg-purple-100 rounded w-2/3" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong mb-8 animate-scale-in">
          <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="text-sm font-semibold">AI-Powered Business Growth Platform</span>
        </div>

        {/* Main heading with 3D effect */}
        <h1
          ref={headingRef}
          className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-tight"
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="block text-gradient-purple" style={{ transform: "translateZ(50px)" }}>
            Transform Your
          </span>
          <span className="block text-gradient-purple mt-2" style={{ transform: "translateZ(100px)" }}>
            Home Business
          </span>
        </h1>

        {/* Subheading */}
        <p
          ref={subheadingRef}
          className="text-xl sm:text-2xl text-[var(--color-fg-muted)] max-w-4xl mx-auto mb-12 leading-relaxed"
          style={{ transform: "translateZ(30px)" }}
        >
          Built for Pakistani women entrepreneurs. Get AI-powered business planning,
          30-day content calendars, performance analytics, and verified mentor support — all in Roman Urdu.
        </p>

        {/* CTA buttons */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ transform: "translateZ(20px)" }}
        >
          <Link
            href="/signup"
            className="btn-primary px-10 py-5 text-lg font-bold inline-flex items-center gap-3 group"
          >
            Start Your Business
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="btn-outline px-10 py-5 text-lg font-bold"
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-gradient-purple mb-2">500+</div>
            <div className="text-sm text-[var(--color-fg-muted)]">Entrepreneurs</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-gradient-purple mb-2">50+</div>
            <div className="text-sm text-[var(--color-fg-muted)]">Mentors</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-gradient-purple mb-2">10K+</div>
            <div className="text-sm text-[var(--color-fg-muted)]">Posts Created</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-gradient-purple mb-2">₨2M+</div>
            <div className="text-sm text-[var(--color-fg-muted)]">Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
