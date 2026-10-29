"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import type { CohortFunnelData } from "@/lib/api";

export interface CohortFunnelChartProps {
  funnelData: CohortFunnelData;
}

const STAGE_COLORS = [
  "var(--color-neutral, #64748b)",
  "var(--color-info, #0284c7)",
  "var(--color-accent, #059669)",
  "var(--color-success, #16a34a)",
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { stage: string; label: string; count: number; percentage: number; step_conversion_rate: number } }>;
}

function CustomFunnelTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-md)] text-xs">
        <p className="font-bold text-[var(--color-fg)] mb-1">{data.label}</p>
        <p className="text-[var(--color-fg-muted)]">
          Entrepreneurs: <span className="font-semibold text-[var(--color-fg)]">{data.count}</span>
        </p>
        <p className="text-[var(--color-fg-muted)]">
          Cohort Share: <span className="font-semibold text-[var(--color-fg)]">{data.percentage}%</span>
        </p>
        {data.stage !== "signed_up" && (
          <p className="text-[var(--color-accent)] font-medium mt-1">
            Step Conversion: {data.step_conversion_rate}%
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function CohortFunnelChart({ funnelData }: CohortFunnelChartProps) {
  const stages = funnelData.stages?.length
    ? funnelData.stages
    : [
        {
          stage: "signed_up" as const,
          label: "Signed Up",
          count: funnelData.signed_up,
          percentage: 100,
          step_conversion_rate: 100,
        },
        {
          stage: "plan_approved" as const,
          label: "Plan Approved",
          count: funnelData.plan_approved,
          percentage: funnelData.signed_up > 0 ? Math.round((funnelData.plan_approved / funnelData.signed_up) * 1000) / 10 : 0,
          step_conversion_rate: funnelData.signed_up > 0 ? Math.round((funnelData.plan_approved / funnelData.signed_up) * 1000) / 10 : 0,
        },
        {
          stage: "first_post" as const,
          label: "First Post",
          count: funnelData.first_post,
          percentage: funnelData.signed_up > 0 ? Math.round((funnelData.first_post / funnelData.signed_up) * 1000) / 10 : 0,
          step_conversion_rate: funnelData.plan_approved > 0 ? Math.round((funnelData.first_post / funnelData.plan_approved) * 1000) / 10 : 0,
        },
        {
          stage: "first_order" as const,
          label: "First Order",
          count: funnelData.first_order,
          percentage: funnelData.signed_up > 0 ? Math.round((funnelData.first_order / funnelData.signed_up) * 1000) / 10 : 0,
          step_conversion_rate: funnelData.first_post > 0 ? Math.round((funnelData.first_order / funnelData.first_post) * 1000) / 10 : 0,
        },
      ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
            <h3 className="text-base font-bold text-[var(--color-fg)]">
              Cohort Progression Funnel
            </h3>
          </div>
          <p className="text-xs text-[var(--color-fg-muted)] mt-1">
            Conversion milestones from initial enrollment to first customer sale
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)] font-medium bg-[var(--color-surface-sunken)] px-3 py-1.5 rounded-[var(--radius-full)]">
          <span>Overall conversion:</span>
          <span className="font-bold text-[var(--color-success)]">
            {stages[3]?.percentage || 0}%
          </span>
        </div>
      </div>

      {/* Step Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage, idx) => (
          <div
            key={stage.stage}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] p-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-2xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1">
              <span>Step {idx + 1}</span>
              {stage.percentage >= 50 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
              ) : null}
            </div>
            <p className="text-sm font-bold text-[var(--color-fg)] truncate">
              {stage.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-[var(--color-fg)]">
                {stage.count}
              </span>
              <span className="text-xs text-[var(--color-fg-muted)] font-medium">
                ({stage.percentage}%)
              </span>
            </div>
            {idx > 0 && (
              <div className="mt-2 text-2xs flex items-center gap-1 text-[var(--color-accent)] font-semibold">
                <ArrowRight className="w-2.5 h-2.5" />
                <span>{stage.step_conversion_rate}% conversion</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-64 w-full pt-2" aria-label="Funnel Stage Chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stages}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="var(--color-fg-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              stroke="var(--color-fg-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomFunnelTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={44}>
              {stages.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
