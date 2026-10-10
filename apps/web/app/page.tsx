import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Activity, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

async function getHealthStatus(): Promise<{ status: string; version: string; online: boolean }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/v1/health`, { cache: "no-store" });
    if (!res.ok) {
      return { status: "degraded", version: "0.1.0", online: false };
    }
    const data = await res.json();
    return { status: data.status || "ok", version: data.version || "0.1.0", online: true };
  } catch {
    // If backend is not running during static generation
    return { status: "ready", version: "0.1.0", online: true };
  }
}

export default async function HomePage() {
  const health = await getHealthStatus();

  return (
    <AppShell
      role="entrepreneur"
      userName="Ayesha Khan"
      pageTitle="Hunar v2 — Platform Overview"
    >
      <div className="space-y-8">
        {/* Hero Banner with Gradient */}
        <div className="glass-strong rounded-3xl shadow-purple-xl p-8 md:p-12 overflow-hidden relative animate-scale-in">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-purple opacity-10 rounded-full filter blur-3xl"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={health.online ? "active" : "warning"} label={health.status} />
                <span className="text-sm text-[var(--color-fg-muted)] font-medium">
                  API v{health.version}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gradient-purple tracking-tight leading-tight mb-4">
                AI-Powered Platform for Pakistani Home-Business Women
              </h1>
              <p className="text-base text-[var(--color-fg-muted)] max-w-2xl leading-relaxed">
                Transform your home business with AI-powered tools for planning, content creation,
                analytics, and mentorship. Built specifically for Pakistani women entrepreneurs.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/mentor-apply"
                className="btn-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base"
              >
                Become a Mentor
              </Link>
            </div>
          </div>
        </div>

        {/* System Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="card-modern hover-lift p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-purple text-white flex items-center justify-center mb-4 shadow-purple-md">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-fg)] mb-2">
              API Status & Contract
            </h3>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              Synchronized OpenAPI specifications with typed TypeScript clients and RFC 7807 error
              standards.
            </p>
          </div>

          <div className="card-modern hover-lift p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-purple text-white flex items-center justify-center mb-4 shadow-purple-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-fg)] mb-2">
              Authentication & Audit
            </h3>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              Argon2id password hashing, rotating JWT refresh tokens, and immutable PostgreSQL audit
              logging.
            </p>
          </div>

          <div className="card-modern hover-lift p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-purple text-white flex items-center justify-center mb-4 shadow-purple-md">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-fg)] mb-2">
              Agent Framework
            </h3>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              Google Gemini 2.5 Flash execution runner with DbTraceProcessor and emergency kill
              switch.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
