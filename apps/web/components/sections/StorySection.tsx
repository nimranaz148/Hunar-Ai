"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollVideo } from "@/components/animations/ScrollVideo";

gsap.registerPlugin(ScrollTrigger);

export function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animate Step 1 - Video from RIGHT
    const step1 = container.querySelector(".story-step-1");
    if (step1) {
      gsap.fromTo(
        step1.querySelector(".video-container"),
        { x: 200, opacity: 0, scale: 0.8 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          scrollTrigger: {
            trigger: step1,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        step1.querySelector(".content"),
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: step1,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );
    }

    // Animate Step 2 - Video from LEFT
    const step2 = container.querySelector(".story-step-2");
    if (step2) {
      gsap.fromTo(
        step2.querySelector(".video-container"),
        { x: -200, opacity: 0, scale: 0.8 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          scrollTrigger: {
            trigger: step2,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        step2.querySelector(".content"),
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: step2,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );
    }

    // Animate Step 3 - Center video with scale
    const step3 = container.querySelector(".story-step-3");
    if (step3) {
      gsap.fromTo(
        step3.querySelector(".product-video"),
        { scale: 0.5, opacity: 0, rotation: -5 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 1.5,
          scrollTrigger: {
            trigger: step3,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );
    }

    // Animate diagrams
    const diagrams = container.querySelectorAll(".diagram-image");
    diagrams.forEach((diagram, index) => {
      gsap.fromTo(
        diagram,
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          scrollTrigger: {
            trigger: diagram,
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <section className="py-32 bg-gradient-to-b from-[#f8f9fa] via-purple/5 to-white relative overflow-hidden">
      <div ref={containerRef} className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-24">
          <h2 className="text-6xl font-black text-[#0f172a] mb-6 tracking-tight">
            Your <span className="text-gradient-purple">Success Story</span>
          </h2>
          <p className="text-xl text-[#64748b] max-w-2xl mx-auto">
            From idea to ₨200K revenue in 90 days — here's how Hunar AI transforms your business
          </p>
        </div>

        {/* Story Step 1: Business Planning - VIDEO RIGHT */}
        <div className="story-step-1 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-40">
          {/* Content LEFT */}
          <div className="content space-y-6">
            <div className="inline-block px-4 py-2 bg-purple/10 rounded-full">
              <span className="text-purple font-bold text-sm">STEP 1 • DAY 1-7</span>
            </div>
            <h3 className="text-5xl font-black text-[#0f172a] leading-tight">
              Plan Your Business in 5 Minutes
            </h3>
            <p className="text-lg text-[#64748b] leading-relaxed">
              Chat with AI in Roman Urdu. Get instant business plan, pricing strategy,
              and 30-day launch roadmap. No complex forms, no business jargon.
            </p>
            <ul className="space-y-3">
              {[
                "Market validation with real data",
                "Profit margin calculator",
                "Competition analysis",
                "Pricing recommendations"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple to-pink flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#0f172a] font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Video RIGHT */}
          <div className="video-container relative">
            <div className="aspect-video rounded-3xl overflow-hidden glass-strong shadow-2xl">
              <ScrollVideo
                src="/Business_growth_3D_animation_1080p_20261012044124.mp4"
                className="w-full h-full object-contain"
                autoplay={true}
              />
            </div>
          </div>
        </div>

        {/* Business Journey Animation Section */}
        <div className="diagram-image mb-40">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple/10 to-pink/10 rounded-full mb-6">
              <span className="text-gradient-purple font-bold text-sm">YOUR ROADMAP TO SUCCESS</span>
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-[#0f172a] mb-6">
              From Idea to Launch in <span className="text-gradient-purple">30 Days</span>
            </h3>
            <p className="text-lg text-[#64748b] max-w-2xl mx-auto mb-8">
              Follow our proven 4-stage framework that's helped 500+ women entrepreneurs
              turn their home business ideas into profitable ventures
            </p>
          </div>

          <div className="max-w-5xl mx-auto glass-strong rounded-3xl p-8 shadow-2xl">
            <div className="aspect-video rounded-2xl overflow-hidden mb-8">
              <ScrollVideo
                src="/Business_journey_roadmap_animation_1080p_20261012193613.mp4"
                className="w-full h-full"
                autoplay={true}
              />
            </div>

            {/* Journey Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "💡", stat: "Day 1-3", label: "Market Validation" },
                { icon: "📋", stat: "Day 4-7", label: "Business Plan" },
                { icon: "🚀", stat: "Day 8-14", label: "Launch Setup" },
                { icon: "📈", stat: "Day 15-30", label: "First Sales" }
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-sm font-black text-gradient-purple mb-1">{item.stat}</div>
                  <div className="text-xs text-[#64748b] font-semibold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Story Step 2: Content Creation - VIDEO LEFT */}
        <div className="story-step-2 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-40">
          {/* Video LEFT */}
          <div className="video-container relative order-2 lg:order-1">
            <div className="aspect-video rounded-3xl overflow-hidden glass-strong shadow-2xl">
              <ScrollVideo
                src="/Holographic_AI_interface_animati…_1080p_20261012044122.mp4"
                className="w-full h-full object-contain"
                autoplay={true}
              />
            </div>
          </div>

          {/* Content RIGHT */}
          <div className="content space-y-6 order-1 lg:order-2">
            <div className="inline-block px-4 py-2 bg-pink/10 rounded-full">
              <span className="text-pink font-bold text-sm">STEP 2 • DAY 8-14</span>
            </div>
            <h3 className="text-5xl font-black text-[#0f172a] leading-tight">
              Launch with 30 Days of Content
            </h3>
            <p className="text-lg text-[#64748b] leading-relaxed">
              AI generates your complete content calendar. Daily post ideas,
              Roman Urdu captions, and scheduling — all ready to go.
            </p>
            <ul className="space-y-3">
              {[
                "30 ready-to-post captions",
                "Product photo ideas",
                "Best posting times",
                "Engagement strategies"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink to-purple flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#0f172a] font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Features Ecosystem - Video */}
        <div className="diagram-image mb-40">
          <div className="max-w-5xl mx-auto glass-strong rounded-3xl p-8 shadow-xl">
            <div className="aspect-video rounded-2xl overflow-hidden">
              <ScrollVideo
                src="/Animated_AI_diagram_showing_feat…_20261012191845.mp4"
                className="w-full h-full object-contain"
                autoplay={true}
              />
            </div>
          </div>
        </div>

        {/* Story Step 3: Growth Timeline - CENTER VIDEO */}
        <div className="story-step-3 text-center mb-40">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple/10 to-pink/10 rounded-full mb-8">
            <span className="text-gradient-purple font-bold text-sm">STEP 3 • DAY 15-90</span>
          </div>
          <h3 className="text-5xl font-black text-[#0f172a] mb-6">
            Your <span className="text-gradient-purple">90-Day Growth Journey</span>
          </h3>
          <p className="text-lg text-[#64748b] mb-16 max-w-2xl mx-auto">
            Track every milestone from first launch to ₨200K monthly revenue.
            See exactly what happens at each stage of your business growth.
          </p>

          {/* Success Timeline Video CENTER */}
          <div className="product-video max-w-4xl mx-auto mb-12">
            <div className="aspect-video rounded-3xl overflow-hidden glass-strong shadow-2xl relative">
              <ScrollVideo
                src="/Timeline_animation_showing_busin…_1080p_20261012191800.mp4"
                className="w-full h-full"
                autoplay={true}
              />
              {/* Glow effect on video */}
              <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-purple/20 shadow-purple-xl"></div>
            </div>
          </div>

          {/* Timeline Highlights */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              {
                day: "Day 1-30",
                title: "Launch Phase",
                description: "Business plan ready, content posted, first customers",
                color: "purple"
              },
              {
                day: "Day 31-60",
                title: "Growth Phase",
                description: "Consistent orders, scaling content, revenue climbing",
                color: "pink"
              },
              {
                day: "Day 61-90",
                title: "Scale Phase",
                description: "₨200K monthly, verified reviews, mentor support",
                color: "purple"
              }
            ].map((phase, i) => (
              <div key={i} className="glass-strong rounded-2xl p-6 text-left hover:shadow-xl transition-all">
                <div className={`inline-block px-3 py-1 bg-${phase.color}/10 rounded-full mb-4`}>
                  <span className={`text-${phase.color} font-bold text-sm`}>{phase.day}</span>
                </div>
                <h4 className="text-xl font-black text-[#0f172a] mb-3">{phase.title}</h4>
                <p className="text-sm text-[#64748b] leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Growth Animation Section */}
        <div className="diagram-image mb-20">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple/10 to-pink/10 rounded-full mb-6">
              <span className="text-gradient-purple font-bold text-sm">PROVEN RESULTS</span>
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-[#0f172a] mb-6">
              Scale from <span className="text-purple">₨20K</span> to <span className="text-pink">₨200K</span> Monthly
            </h3>
            <p className="text-lg text-[#64748b] max-w-3xl mx-auto mb-8">
              Watch how our AI-powered platform helps you grow your revenue 10x in just 6 months.
              Real data from real entrepreneurs like you.
            </p>
          </div>

          <div className="max-w-5xl mx-auto glass-strong rounded-3xl p-8 shadow-2xl">
            <div className="aspect-video rounded-2xl overflow-hidden mb-8">
              <ScrollVideo
                src="/Revenue_growth_chart_showing_bus…_20261012193442.mp4"
                className="w-full h-full"
                autoplay={true}
              />
            </div>

            {/* Revenue Milestones */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { month: "Month 1-2", revenue: "₨20K-35K", growth: "+75%", icon: "🌱" },
                { month: "Month 3-4", revenue: "₨60K-90K", growth: "+120%", icon: "🚀" },
                { month: "Month 5-6", revenue: "₨140K-200K", growth: "+180%", icon: "💎" }
              ].map((item, i) => (
                <div key={i} className="text-center p-6 rounded-xl bg-gradient-to-br from-white to-purple/5 hover:shadow-lg transition-all border border-purple/10">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-2xl font-black text-gradient-purple mb-2">{item.revenue}</div>
                  <div className="text-sm text-[#64748b] font-semibold mb-2">{item.month}</div>
                  <div className="inline-block px-3 py-1 bg-green-100 rounded-full">
                    <span className="text-xs font-bold text-green-700">{item.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
