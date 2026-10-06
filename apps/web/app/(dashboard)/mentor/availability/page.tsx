"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  RotateCcw,
  Save,
  Globe,
  Sun,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  MentorsService,
  type AvailabilitySlotItem,
  ApiError,
} from "@/lib/api";

const DAYS_OF_WEEK = [
  { day: 0, name: "Monday", shortName: "Mon", isWeekend: false },
  { day: 1, name: "Tuesday", shortName: "Tue", isWeekend: false },
  { day: 2, name: "Wednesday", shortName: "Wed", isWeekend: false },
  { day: 3, name: "Thursday", shortName: "Thu", isWeekend: false },
  { day: 4, name: "Friday", shortName: "Fri", isWeekend: false },
  { day: 5, name: "Saturday", shortName: "Sat", isWeekend: true },
  { day: 6, name: "Sunday", shortName: "Sun", isWeekend: true },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  const hh = h.toString().padStart(2, "0");
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:30`);
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesDuration(startStr: string, endStr: string): string {
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  if (end <= start) return "Invalid";
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (minutes === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours}h ${minutes}m`;
}

interface DaySlotState {
  weekday: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DEFAULT_SCHEDULE: DaySlotState[] = DAYS_OF_WEEK.map((d) => ({
  weekday: d.day,
  start_time: "09:00",
  end_time: "17:00",
  is_available: !d.isWeekend,
}));

export default function MentorAvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySlotState[]>(DEFAULT_SCHEDULE);
  const [initialSchedule, setInitialSchedule] = useState<DaySlotState[]>(DEFAULT_SCHEDULE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let ignore = false;

    async function loadAvailability() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await MentorsService.getOwnAvailabilityApiV1MentorsMeAvailabilityGet();
        if (!ignore && response && response.slots && response.slots.length > 0) {
          const slotMap = new Map<number, AvailabilitySlotItem>();
          response.slots.forEach((s) => slotMap.set(s.weekday, s));

          const merged: DaySlotState[] = DAYS_OF_WEEK.map((d) => {
            const found = slotMap.get(d.day);
            if (found) {
              return {
                weekday: d.day,
                start_time: found.start_time,
                end_time: found.end_time,
                is_available: found.is_available ?? false,
              };
            }
            return {
              weekday: d.day,
              start_time: "09:00",
              end_time: "17:00",
              is_available: !d.isWeekend,
            };
          });

          setSchedule(merged);
          setInitialSchedule(merged);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setErrorMessage(err.body?.detail || "Failed to load availability schedule.");
          } else {
            setErrorMessage("An unexpected error occurred while loading schedule.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      ignore = true;
    };
  }, []);

  const totalWeeklyHours = useMemo(() => {
    return schedule.reduce((acc, slot) => {
      if (!slot.is_available) return acc;
      const s = timeToMinutes(slot.start_time);
      const e = timeToMinutes(slot.end_time);
      if (e > s) {
        return acc + (e - s) / 60;
      }
      return acc;
    }, 0);
  }, [schedule]);

  const activeDaysCount = useMemo(() => {
    return schedule.filter((s) => s.is_available).length;
  }, [schedule]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(schedule) !== JSON.stringify(initialSchedule);
  }, [schedule, initialSchedule]);

  const updateSlot = (day: number, updates: Partial<DaySlotState>) => {
    setSchedule((prev) =>
      prev.map((slot) => {
        if (slot.weekday === day) {
          const next = { ...slot, ...updates };
          // Clear validation error for this day if resolved
          if (next.is_available && timeToMinutes(next.start_time) < timeToMinutes(next.end_time)) {
            setValidationErrors((errs) => {
              const copy = { ...errs };
              delete copy[day];
              return copy;
            });
          }
          return next;
        }
        return slot;
      })
    );
  };

  const handleApplyMondayToAll = () => {
    const mondaySlot = schedule.find((s) => s.weekday === 0) || DEFAULT_SCHEDULE[0];
    setSchedule((prev) =>
      prev.map((slot) => {
        // Apply Monday settings to Tuesday (1) through Friday (4)
        if (slot.weekday >= 1 && slot.weekday <= 4) {
          return {
            ...slot,
            start_time: mondaySlot.start_time,
            end_time: mondaySlot.end_time,
            is_available: mondaySlot.is_available,
          };
        }
        return slot;
      })
    );
    setValidationErrors({});
    setSuccessMessage("Applied Monday schedule to all weekdays (Tue–Fri). Remember to save changes.");
  };

  const handleResetDefault = () => {
    setSchedule(DEFAULT_SCHEDULE);
    setValidationErrors({});
    setSuccessMessage("Reset schedule to default 9:00 - 17:00 weekday hours. Click Save to persist.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate slots
    const errors: Record<number, string> = {};
    for (const slot of schedule) {
      if (slot.is_available) {
        if (timeToMinutes(slot.start_time) >= timeToMinutes(slot.end_time)) {
          errors[slot.weekday] = "Start time must be before end time.";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please fix time slot errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await MentorsService.updateOwnAvailabilityApiV1MentorsMeAvailabilityPut({
        requestBody: {
          slots: schedule.map((s) => ({
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
            is_available: s.is_available,
          })),
        },
      });

      const updatedSlots: DaySlotState[] = response.slots.map((s) => ({
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
        is_available: s.is_available ?? false,
      }));

      setSchedule(updatedSlots);
      setInitialSchedule(updatedSlots);
      setValidationErrors({});
      setSuccessMessage("Weekly availability schedule saved successfully!");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.body?.detail || "Failed to update availability schedule.");
      } else {
        setErrorMessage("An unexpected error occurred while saving schedule.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell role="mentor">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Weekly Availability
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your regular working hours so entrepreneurs can book sessions with you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleApplyMondayToAll}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Mon to Weekdays
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !hasUnsavedChanges}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 text-sm rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* KPI & Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Weekly Available Hours
              </p>
              <p className="text-xl font-bold text-foreground">
                {totalWeeklyHours.toFixed(1)} hrs
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Working Days
              </p>
              <p className="text-xl font-bold text-foreground">
                {activeDaysCount} of 7 days
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Timezone
              </p>
              <p className="text-sm font-semibold text-foreground">
                PKT (UTC+05:00)
              </p>
            </div>
          </div>
        </div>

        {/* Unsaved indicator banner */}
        {hasUnsavedChanges && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>You have unsaved changes in your availability schedule.</span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="underline hover:text-amber-900 dark:hover:text-amber-100 font-semibold cursor-pointer"
            >
              Save now
            </button>
          </div>
        )}

        {/* Schedule Grid */}
        <form onSubmit={handleSave}>
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs divide-y divide-border">
            <div className="px-5 py-3 bg-muted/40 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Day & Status</span>
              <span>Available Time Interval</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <Clock className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-sm">Loading your weekly schedule...</p>
              </div>
            ) : (
              DAYS_OF_WEEK.map((dayInfo) => {
                const slot = schedule.find((s) => s.weekday === dayInfo.day) || {
                  weekday: dayInfo.day,
                  start_time: "09:00",
                  end_time: "17:00",
                  is_available: false,
                };
                const hasError = !!validationErrors[dayInfo.day];

                return (
                  <div
                    key={dayInfo.day}
                    className={`p-4 sm:px-6 transition-colors ${
                      slot.is_available
                        ? "bg-card"
                        : "bg-muted/10 opacity-75"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Day Label & Toggle */}
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.is_available}
                            onChange={(e) =>
                              updateSlot(dayInfo.day, { is_available: e.target.checked })
                            }
                            aria-label={`Toggle ${dayInfo.name} availability`}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {dayInfo.name}
                            </span>
                            {dayInfo.isWeekend && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                                Weekend
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {slot.is_available ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Active ({formatMinutesDuration(slot.start_time, slot.end_time)})
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unavailable / Off</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Time Pickers (visible if active) */}
                      {slot.is_available ? (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`start-time-${dayInfo.day}`}
                              className="text-xs text-muted-foreground sr-only"
                            >
                              {dayInfo.name} Start Time
                            </label>
                            <select
                              id={`start-time-${dayInfo.day}`}
                              value={slot.start_time}
                              onChange={(e) =>
                                updateSlot(dayInfo.day, { start_time: e.target.value })
                              }
                              className={`h-9 px-2.5 py-1 text-xs rounded-lg border bg-background text-foreground shadow-xs focus:ring-1 focus:ring-primary ${
                                hasError ? "border-destructive text-destructive" : "border-border"
                              }`}
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>

                            <span className="text-xs text-muted-foreground">to</span>

                            <label
                              htmlFor={`end-time-${dayInfo.day}`}
                              className="text-xs text-muted-foreground sr-only"
                            >
                              {dayInfo.name} End Time
                            </label>
                            <select
                              id={`end-time-${dayInfo.day}`}
                              value={slot.end_time}
                              onChange={(e) =>
                                updateSlot(dayInfo.day, { end_time: e.target.value })
                              }
                              className={`h-9 px-2.5 py-1 text-xs rounded-lg border bg-background text-foreground shadow-xs focus:ring-1 focus:ring-primary ${
                                hasError ? "border-destructive text-destructive" : "border-border"
                              }`}
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          No booking slots on this day
                        </div>
                      )}
                    </div>

                    {hasError && (
                      <p className="mt-2 text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors[dayInfo.day]}
                      </p>
                    )}
                  </div>
                );
              })
            )}

            <div className="p-4 bg-muted/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Changes will take effect immediately for future calendar bookings.
              </p>
              <button
                type="submit"
                disabled={isSaving || isLoading || !hasUnsavedChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
