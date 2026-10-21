"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "../ui/MagneticButton";

export function NavigationBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b border-[#e5e7eb] transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm"
          : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-purple text-white flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105">
              H
            </div>
            <span className="font-black text-2xl text-[#0f172a] tracking-tight">
              Hunar
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#64748b] hover:text-[#0f172a] transition"
            >
              Sign In
            </Link>
            <MagneticButton strength={0.2}>
              <Link
                href="/signup"
                className="btn-primary px-6 py-3 text-sm inline-flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </MagneticButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
