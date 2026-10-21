"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { CounterAnimation } from "./CounterAnimation";
import { MagneticButton } from "../ui/MagneticButton";

export function Hero3D() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Background Video - Properly Visible with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-75"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <source src="/Abstract_3D_animation_for_website_20261012191704.mp4" type="video/mp4" />
        </video>
        {/* Light gradient overlay - balanced for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/40" />
      </div>

      {/* Animated gradient orbs in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple rounded-full filter blur-3xl opacity-15 animate-float-shapes" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-pink rounded-full filter blur-3xl opacity-10 animate-float-shapes" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple rounded-full filter blur-3xl opacity-10 animate-float-shapes" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main content - fully visible always */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center pt-20 pb-20">
        {/* Main heading - bold, large, confident */}
        <h1
          className="text-7xl sm:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tight"
        >
          <span className="block text-[#0f172a]">
            Transform Your
          </span>
          <span className="block text-[#0f172a] mt-4">
            Home <span className="text-gradient-purple inline-block">Business</span>
          </span>
        </h1>

        {/* Subheading - generous spacing */}
        <p
          className="text-xl sm:text-2xl text-[#64748b] max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
        >
          AI-powered platform built for Pakistani women entrepreneurs.
          <br />
          <span className="text-[#475569]">Business planning to first sale in 30 days — all in Roman Urdu.</span>
        </p>

        {/* CTA buttons - premium design with magnetic effect */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-32"
        >
          <MagneticButton strength={0.25}>
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-3 group shadow-purple-lg hover:shadow-purple-xl"
            >
              <span>Start Your Business</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.25}>
            <Link
              href="/login"
              className="btn-outline inline-flex items-center gap-3 hover:shadow-md"
            >
              <Play className="w-4 h-4" />
              <span>Watch Demo</span>
            </Link>
          </MagneticButton>
        </div>

        {/* Stats - premium cards with glass effect */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { value: "500", suffix: "+", label: "Entrepreneurs" },
            { value: "50", suffix: "+", label: "Mentors" },
            { value: "10K", suffix: "+", label: "Posts Created" },
            { value: "₨2M", suffix: "+", label: "Revenue" },
          ].map((stat, index) => (
            <div
              key={index}
              className="kpi-card group cursor-default hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CounterAnimation
                value={stat.value}
                suffix={stat.suffix}
                duration={2000}
                className="kpi-value mb-2"
                suffixClassName="text-gradient-purple"
              />
              <div className="kpi-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
