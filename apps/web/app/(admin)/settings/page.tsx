"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FormField, Input } from "@/components/ui/FormField";
import { AdminService, ApiError } from "@/lib/api";
import { LoadingState } from "@/components/ui/LoadingState";
import { ShieldAlert, Save, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    agent_max_concurrent: 5,
    agent_per_user_daily_limit: 5,
    agent_kill_switch: false,
    rate_limit_per_minute: 100,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmKillSwitch, setConfirmKillSwitch] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const resp = await AdminService.readSystemSettingsApiV1AdminSettingsGet();
        setSettings({
          agent_max_concurrent: resp.agent_max_concurrent ?? 5,
          agent_per_user_daily_limit: resp.agent_per_user_daily_limit ?? 5,
          agent_kill_switch: resp.agent_kill_switch ?? false,
          rate_limit_per_minute: resp.rate_limit_per_minute ?? 100,
        });
      } catch {
        // Fallback defaults
      } finally {
        setIsLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await AdminService.modifySystemSettingsApiV1AdminSettingsPatch({
        requestBody: {
          agent_max_concurrent: Number(settings.agent_max_concurrent),
          agent_per_user_daily_limit: Number(settings.agent_per_user_daily_limit),
          rate_limit_per_minute: Number(settings.rate_limit_per_minute),
          agent_kill_switch: settings.agent_kill_switch,
        },
      });
      setSettings({
        agent_max_concurrent: updated.agent_max_concurrent ?? 5,
        agent_per_user_daily_limit: updated.agent_per_user_daily_limit ?? 5,
        agent_kill_switch: updated.agent_kill_switch ?? false,
        rate_limit_per_minute: updated.rate_limit_per_minute ?? 100,
      });
      setMessage({ text: "System settings saved successfully.", type: "success" });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
        setMessage({ text: String((err.body as { detail: string }).detail), type: "error" });
      } else {
        setMessage({ text: "Failed to save settings.", type: "error" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    setIsSaving(true);
    try {
      const resp = await AdminService.toggleAgentKillSwitchApiV1AdminKillSwitchPost();
      setSettings((prev) => ({ ...prev, agent_kill_switch: resp.agent_kill_switch }));
      setConfirmKillSwitch(false);
      setMessage({
        text: resp.agent_kill_switch
          ? "Emergency kill switch activated. All agent workflows are now paused."
          : "Emergency kill switch deactivated. Agent execution resumed.",
        type: "success",
      });
    } catch {
      setSettings((prev) => ({ ...prev, agent_kill_switch: !prev.agent_kill_switch }));
      setConfirmKillSwitch(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell
        role="super_admin"
        userName="Super Admin"
        pageTitle="System Settings (F-035)"
      >
        <LoadingState message="Loading system configuration..." />
      </AppShell>
    );
  }

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="System Settings (F-035)"
    >
      <div className="max-w-[var(--layout-form-max)] space-y-6">
        {/* Kill Switch Card */}
        <div
          className={`p-6 rounded-[var(--radius-lg)] border transition-colors shadow-[var(--shadow-sm)] ${
            settings.agent_kill_switch
              ? "bg-[var(--color-danger-subtle)] border-[var(--color-danger-border)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-[var(--radius-md)] ${
                  settings.agent_kill_switch
                    ? "bg-[var(--color-danger)] text-[var(--color-fg-inverse)]"
                    : "bg-[var(--color-neutral-subtle)] text-[var(--color-neutral)]"
                }`}
              >
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-fg)]">
                  Emergency AI Kill Switch (PRD §36.18)
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1 max-w-xl">
                  Immediately halts all active and queued agent runs across the platform. Use
                  during suspected prompt injections, anomalous token consumption, or upstream
                  outages.
                </p>
                <span
                  className={`inline-block mt-2 font-mono text-2xs font-bold px-2 py-0.5 rounded ${
                    settings.agent_kill_switch
                      ? "bg-[var(--color-danger)] text-[var(--color-fg-inverse)]"
                      : "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                  }`}
                >
                  STATUS: {settings.agent_kill_switch ? "ACTIVE (SYSTEM HALTED)" : "STANDBY (NORMAL)"}
                </span>
              </div>
            </div>

            <div>
              {confirmKillSwitch ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleKillSwitch}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-danger)] text-[var(--color-fg-inverse)] text-xs font-bold cursor-pointer"
                  >
                    Confirm {settings.agent_kill_switch ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmKillSwitch(false)}
                    className="px-2 py-1.5 rounded border border-[var(--color-border)] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmKillSwitch(true)}
                  className={`px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-colors cursor-pointer shadow-[var(--shadow-sm)] ${
                    settings.agent_kill_switch
                      ? "bg-[var(--color-surface)] border border-[var(--color-danger-border)] text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
                      : "bg-[var(--color-danger)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-danger-hover)]"
                  }`}
                >
                  {settings.agent_kill_switch ? "Deactivate Kill Switch" : "Enable Emergency Kill Switch"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <h3 className="text-base font-bold text-[var(--color-fg)] mb-4">
            Concurrency & Quota Limits
          </h3>

          {message && (
            <div
              className={`mb-5 p-3 rounded-[var(--radius-sm)] flex items-center gap-2 text-xs font-medium ${
                message.type === "success"
                  ? "bg-[var(--color-success-subtle)] border border-[var(--color-success-border)] text-[var(--color-success)]"
                  : "bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-[var(--color-danger)]"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <FormField
              label="Maximum Concurrent Agent Workflows"
              name="agent_max_concurrent"
              hint="Semaphore concurrency ceiling (default: 5 runs). Workflows exceeding limit are queued."
              required
            >
              <Input
                type="number"
                min={1}
                max={50}
                required
                value={settings.agent_max_concurrent}
                onChange={(e) =>
                  setSettings({ ...settings, agent_max_concurrent: parseInt(e.target.value) || 1 })
                }
              />
            </FormField>

            <FormField
              label="Per-User Daily Agent Runs Limit"
              name="agent_per_user_daily_limit"
              hint="Maximum allowed automated workflow triggers per entrepreneur account per day."
              required
            >
              <Input
                type="number"
                min={1}
                max={100}
                required
                value={settings.agent_per_user_daily_limit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    agent_per_user_daily_limit: parseInt(e.target.value) || 1,
                  })
                }
              />
            </FormField>

            <FormField
              label="API Rate Limit (Requests per minute)"
              name="rate_limit_per_minute"
              hint="Token bucket per-client IP request rate."
              required
            >
              <Input
                type="number"
                min={10}
                max={10000}
                required
                value={settings.rate_limit_per_minute}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rate_limit_per_minute: parseInt(e.target.value) || 10,
                  })
                }
              />
            </FormField>

            <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors shadow-[var(--shadow-sm)] cursor-pointer disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
