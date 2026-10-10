"use client";

import Link from "next/link";
import {
  Sparkles,
  BarChart3,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
  Globe,
  MessageCircle,
  Star,
  Rocket,
  Target,
  Award,
} from "lucide-react";
import { Hero3D } from "@/components/animations/Hero3D";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ImageSequence } from "@/components/animations/ImageSequence";
import { ParallaxSection } from "@/components/animations/ParallaxSection";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Navigation - clean, minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e5e7eb] backdrop-blur-sm bg-opacity-95">
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
              <Link
                href="/signup"
                className="btn-primary px-6 py-3 text-sm inline-flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 3D Hero Section */}
      <Hero3D />

      {/* Image Sequence Scroll Animation */}
      <ImageSequence className="my-0" />

      {/* Features Grid with Scroll Reveals */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black/5 to-purple-50/30 relative overflow-hidden">
        {/* Parallax Background Elements */}
        <ParallaxSection speed={0.3} className="absolute top-20 left-10 opacity-30">
          <div className="w-64 h-64 bg-purple-300 rounded-full filter blur-3xl"></div>
        </ParallaxSection>
        <ParallaxSection speed={0.5} className="absolute bottom-40 right-10 opacity-20">
          <div className="w-80 h-80 bg-pink-300 rounded-full filter blur-3xl"></div>
        </ParallaxSection>

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal direction="up" className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-gradient-purple mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-[var(--color-fg-muted)] max-w-3xl mx-auto leading-relaxed">
              Powerful AI tools designed specifically for Pakistani home-based businesses.
              From idea validation to revenue generation.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <ScrollReveal direction="up" delay={0}>
              <div className="card-modern hover-lift p-8 group h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all group-hover:scale-110">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                  AI Business Planning
                </h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Get validated business plans, unit economics, and pricing strategies through natural Roman Urdu conversation.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Market validation in 5 minutes
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Profit margin calculator
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    30-day launch roadmap
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Feature 2 */}
            <ScrollReveal direction="up" delay={0.1}>
              <div className="card-modern hover-lift p-8 group h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all group-hover:scale-110">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                  Content Calendar
                </h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  AI-generated 30-day content calendar with daily post ideas, captions in Roman Urdu, and scheduling.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    30 ready-to-post captions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Content themes & pillars
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Weekly optimization
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Feature 3 */}
            <ScrollReveal direction="up" delay={0.2}>
              <div className="card-modern hover-lift p-8 group h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all group-hover:scale-110">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                  Performance Analytics
                </h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Track views, engagement, inquiries, and revenue with beautiful charts and weekly AI coach reviews.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Real-time dashboard
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Weekly growth reports
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    AI recommendations
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Feature 4 */}
            <ScrollReveal direction="up" delay={0.3}>
              <div className="card-modern hover-lift p-8 group h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all group-hover:scale-110">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                  Verified Mentors
                </h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Book 1-on-1 sessions with verified business mentors. Secure escrow payments and reviewed sessions.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Expert marketplace
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Secure payments
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Session recordings
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Feature 5 */}
            <ScrollReveal direction="up" delay={0.4}>
              <div className="card-modern hover-lift p-8 group h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all group-hover:scale-110">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                  Roman Urdu Support
                </h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Talk to AI agents in natural Roman Urdu. No complex English forms or business jargon required.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Natural conversation
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Cultural context
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Local expertise
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Feature 6 */}
            <ScrollReveal direction="up" delay={0.5}>
              <div className="card-modern hover-lift p-8 group h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all group-hover:scale-110">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                  Human Approval Gates
                </h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  AI never acts without your permission. Review and approve every major plan before execution.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Plan approval gate
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Content review gate
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                    Weekly coach gate
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/30 to-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up" className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-gradient-purple mb-6">
              Your Journey to Success
            </h2>
            <p className="text-xl text-[var(--color-fg-muted)] max-w-3xl mx-auto leading-relaxed">
              From idea to first sale in 30 days. Our proven AI-powered process guides you every step of the way.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <ScrollReveal direction="left" delay={0.1}>
              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-purple text-white flex items-center justify-center shadow-purple-xl group-hover:scale-110 transition-all">
                  <Rocket className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-3">1. Plan & Validate</h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed">
                  Chat with our AI in Roman Urdu. Get your business plan validated, pricing calculated, and launch roadmap in 5 minutes.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-purple text-white flex items-center justify-center shadow-purple-xl group-hover:scale-110 transition-all">
                  <Target className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-3">2. Create & Launch</h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed">
                  AI generates 30 days of content. Approve your calendar and start posting. Track daily metrics and engagement.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.3}>
              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-purple text-white flex items-center justify-center shadow-purple-xl group-hover:scale-110 transition-all">
                  <Award className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-3">3. Grow & Scale</h3>
                <p className="text-[var(--color-fg-muted)] leading-relaxed">
                  Weekly AI coach reviews your performance. Book verified mentors for growth. Scale your revenue month-over-month.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600 rounded-full filter blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal direction="up" className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-black mb-6 text-gradient-purple">
              Proven Results
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real women. Real businesses. Real revenue.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <ScrollReveal direction="up" delay={0.1}>
              <div className="text-center">
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">500+</div>
                <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Active Entrepreneurs</div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <div className="text-center">
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">50+</div>
                <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Verified Mentors</div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <div className="text-center">
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">10K+</div>
                <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Posts Created</div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <div className="text-center">
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">₨2M+</div>
                <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Revenue Generated</div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up" className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-gradient-purple mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-[var(--color-fg-muted)] max-w-3xl mx-auto">
              Hear from women entrepreneurs who transformed their businesses with Hunar
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal direction="left" delay={0.1}>
              <div className="card-modern p-8 hover-lift">
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-6 italic">
                  "Hunar AI ne meri bakery ko pehchaan di. 30-day content calendar se daily posts ready hoti hain. Pehle mahine mein ₨50,000 ki sales!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-purple"></div>
                  <div>
                    <p className="font-bold">Fatima Ali</p>
                    <p className="text-sm text-[var(--color-fg-muted)]">Home Baker, Lahore</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <div className="card-modern p-8 hover-lift">
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-6 italic">
                  "Roman Urdu mein AI se baat karna bohot easy hai. Mentor booking aur escrow payment se trust bana. Game changer!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-purple"></div>
                  <div>
                    <p className="font-bold">Samina Bibi</p>
                    <p className="text-sm text-[var(--color-fg-muted)]">Handicrafts, Karachi</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.3}>
              <div className="card-modern p-8 hover-lift">
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-[var(--color-fg-muted)] leading-relaxed mb-6 italic">
                  "Weekly coach feedback se meri strategy improve hoti rehti hai. Performance charts se apni growth dikh rahi hai!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-purple"></div>
                  <div>
                    <p className="font-bold">Ayesha Khan</p>
                    <p className="text-sm text-[var(--color-fg-muted)]">Fashion Designer, Islamabad</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/30 to-transparent">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="scale">
            <div className="card-modern p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-purple opacity-10 rounded-full filter blur-3xl animate-float-shapes"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 opacity-10 rounded-full filter blur-3xl animate-float-shapes" style={{ animationDelay: '2s' }}></div>

              <div className="relative z-10">
                <h2 className="text-5xl sm:text-6xl font-black text-gradient-purple mb-6">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-xl text-[var(--color-fg-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join hundreds of Pakistani women entrepreneurs building successful home businesses with AI-powered guidance.
                </p>
                <Link
                  href="/signup"
                  className="btn-primary px-12 py-6 text-xl inline-flex items-center gap-3 group"
                >
                  Start Free Today
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-sm text-[var(--color-fg-subtle)] mt-6">
                  No credit card required • Free forever • Cancel anytime
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-purple text-white flex items-center justify-center font-bold">
                  H
                </div>
                <span className="font-black text-lg text-gradient-purple">Hunar</span>
              </div>
              <p className="text-sm text-[var(--color-fg-muted)]">
                AI-powered platform for Pakistani women entrepreneurs
              </p>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-fg)] mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
                <li><Link href="/features" className="hover:text-[var(--color-accent)] transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-[var(--color-accent)] transition">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-[var(--color-accent)] transition">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-fg)] mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
                <li><Link href="/about" className="hover:text-[var(--color-accent)] transition">About</Link></li>
                <li><Link href="/mentor-apply" className="hover:text-[var(--color-accent)] transition">Become a Mentor</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--color-accent)] transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-fg)] mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
                <li><Link href="/help" className="hover:text-[var(--color-accent)] transition">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-[var(--color-accent)] transition">Documentation</Link></li>
                <li><Link href="/login" className="hover:text-[var(--color-accent)] transition">Sign In</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] pt-8 text-center text-sm text-[var(--color-fg-muted)]">
            <p>© 2026 Hunar v2. Built with ❤️ for Pakistani women entrepreneurs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
