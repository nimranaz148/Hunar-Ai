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
  Star
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-purple text-white flex items-center justify-center font-bold text-lg shadow-purple-md">
                H
              </div>
              <div>
                <span className="font-black text-xl text-gradient-purple tracking-tight">
                  Hunar
                </span>
                <span className="text-xs text-[var(--color-fg-muted)] ml-2">v2</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-primary px-6 py-2 text-sm inline-flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-float-shapes"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-300 rounded-full filter blur-3xl opacity-20 animate-float-shapes" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="text-sm font-semibold text-[var(--color-fg)]">
              AI-Powered Business Growth Platform
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gradient-purple tracking-tight leading-tight mb-6 animate-scale-in">
            Transform Your Home
            <br />
            Business Journey
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-[var(--color-fg-muted)] max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Built for Pakistani women entrepreneurs. Get AI-powered business planning,
            30-day content calendars, performance analytics, and verified mentor support — all in Roman Urdu.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-in">
            <Link
              href="/signup"
              className="btn-primary px-8 py-4 text-lg inline-flex items-center gap-2 w-full sm:w-auto"
            >
              Start Your Business
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="btn-outline px-8 py-4 text-lg inline-flex items-center gap-2 w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-[var(--color-fg-muted)]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-pink-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-purple-300 border-2 border-white"></div>
              </div>
              <span className="font-medium">500+ Women Entrepreneurs</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="ml-2 font-medium">4.9/5 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-purple-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gradient-purple mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-[var(--color-fg-muted)] max-w-2xl mx-auto">
              Powerful AI tools designed specifically for Pakistani home-based businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-modern hover-lift p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                AI Business Planning
              </h3>
              <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                Get validated business plans, unit economics, and pricing strategies through natural Roman Urdu conversation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Market validation in 5 minutes
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Profit margin calculator
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  30-day launch roadmap
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="card-modern hover-lift p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                Content Calendar
              </h3>
              <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                AI-generated 30-day content calendar with daily post ideas, captions in Roman Urdu, and scheduling.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  30 ready-to-post captions
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Content themes & pillars
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Weekly optimization
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="card-modern hover-lift p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                Performance Analytics
              </h3>
              <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                Track views, engagement, inquiries, and revenue with beautiful charts and weekly AI coach reviews.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Real-time dashboard
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Weekly growth reports
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  AI recommendations
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="card-modern hover-lift p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                Verified Mentors
              </h3>
              <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                Book 1-on-1 sessions with verified business mentors. Secure escrow payments and reviewed sessions.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Expert marketplace
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Secure payments
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Session recordings
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="card-modern hover-lift p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                Roman Urdu Support
              </h3>
              <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                Talk to AI agents in natural Roman Urdu. No complex English forms or business jargon required.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Natural conversation
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Cultural context
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Local expertise
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="card-modern hover-lift p-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center mb-6 shadow-purple-lg group-hover:shadow-purple-xl transition-all">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-fg)] mb-3">
                Human Approval Gates
              </h3>
              <p className="text-[var(--color-fg-muted)] leading-relaxed mb-4">
                AI never acts without your permission. Review and approve every major plan before execution.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Plan approval gate
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Content review gate
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                  Weekly coach gate
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-gradient-purple mb-2">500+</div>
              <div className="text-sm text-[var(--color-fg-muted)] font-medium">Active Entrepreneurs</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-gradient-purple mb-2">50+</div>
              <div className="text-sm text-[var(--color-fg-muted)] font-medium">Verified Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-gradient-purple mb-2">10K+</div>
              <div className="text-sm text-[var(--color-fg-muted)] font-medium">Content Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-gradient-purple mb-2">₨2M+</div>
              <div className="text-sm text-[var(--color-fg-muted)] font-medium">Revenue Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-modern p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-purple opacity-10 rounded-full filter blur-3xl animate-float-shapes"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-300 opacity-10 rounded-full filter blur-3xl animate-float-shapes" style={{ animationDelay: '2s' }}></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-black text-gradient-purple mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-[var(--color-fg-muted)] mb-8 max-w-2xl mx-auto">
                Join hundreds of Pakistani women entrepreneurs building successful home businesses with AI-powered guidance.
              </p>
              <Link
                href="/signup"
                className="btn-primary px-10 py-5 text-lg inline-flex items-center gap-2"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-[var(--color-fg-subtle)] mt-4">
                No credit card required • Free forever • Cancel anytime
              </p>
            </div>
          </div>
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
