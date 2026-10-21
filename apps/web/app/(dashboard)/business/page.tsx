"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Edit3,
  Save,
  X,
  MapPin,
  Clock,
  Coins,
  MessageCircle,
  Share2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input } from "@/components/ui/FormField";
import { BusinessService, type BusinessResponse } from "@/lib/api";
import { formatPKR, formatDateTime } from "@/lib/format";
import {
  updateBusinessSchema,
  businessNiches,
  businessTones,
  businessLanguages,
  businessPlatforms,
} from "@/lib/schemas/business";

const NICHE_LABELS: Record<string, string> = {
  food: "Food & Bakery",
  crafts: "Handcrafted & Arts",
  fashion: "Fashion & Apparel",
  services: "Services",
  other: "Other",
};

const TONE_LABELS: Record<string, string> = {
  friendly: "Friendly & Warm",
  professional: "Professional & Trustworthy",
  urgent: "Urgent & Direct",
  casual: "Casual & Easygoing",
};

const LANGUAGE_LABELS: Record<string, string> = {
  roman_ur: "Roman Urdu",
  ur: "Urdu (اردو)",
  en: "English",
};

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  daraz: "Daraz",
};

interface FormState {
  name: string;
  niche: string;
  city: string;
  area: string;
  budget_pkr: string | number;
  hours_per_week: string | number;
  tone: string;
  languages: string[];
  platforms: string[];
  target_customer: string;
}

function extractFormData(biz: BusinessResponse): FormState {
  return {
    name: biz.name || "",
    niche: biz.niche || "food",
    city: biz.city || "",
    area: biz.area || "",
    budget_pkr: biz.budget_pkr ?? 0,
    hours_per_week: biz.hours_per_week ?? 0,
    tone: biz.tone || "friendly",
    languages: biz.languages && biz.languages.length > 0 ? biz.languages : ["roman_ur"],
    platforms: biz.platforms && biz.platforms.length > 0 ? biz.platforms : ["whatsapp"],
    target_customer: biz.target_customer || "",
  };
}

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormState>({
    name: "",
    niche: "food",
    city: "",
    area: "",
    budget_pkr: 0,
    hours_per_week: 0,
    tone: "friendly",
    languages: ["roman_ur"],
    platforms: ["whatsapp"],
    target_customer: "",
  });

  const refetch = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNotFound(false);
    BusinessService.getCurrentUserBusinessApiV1BusinessesGet()
      .then((data) => {
        setBusiness(data);
        setFormData(extractFormData(data));
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const errorObj = err as { status?: number; message?: string };
        if (errorObj?.status === 404) {
          setNotFound(true);
        } else {
          setErrorMessage(
            errorObj?.message || "Failed to load business profile. Please try again."
          );
        }
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    BusinessService.getCurrentUserBusinessApiV1BusinessesGet()
      .then((data) => {
        if (!isMounted) return;
        setBusiness(data);
        setFormData(extractFormData(data));
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const errorObj = err as { status?: number; message?: string };
        if (errorObj?.status === 404) {
          setNotFound(true);
        } else {
          setErrorMessage(
            errorObj?.message || "Failed to load business profile. Please try again."
          );
        }
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    if (business) {
      setFormData(extractFormData(business));
    }
    setSaveSuccess(null);
    setFormErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (business) {
      setFormData(extractFormData(business));
    }
    setFormErrors({});
    setIsEditing(false);
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.languages.includes(lang);
      if (exists) {
        if (prev.languages.length === 1) return prev; // Keep at least one
        return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      }
      return { ...prev, languages: [...prev.languages, lang] };
    });
  };

  const togglePlatform = (plat: string) => {
    setFormData((prev) => {
      const exists = prev.platforms.includes(plat);
      if (exists) {
        return { ...prev, platforms: prev.platforms.filter((p) => p !== plat) };
      }
      return { ...prev, platforms: [...prev.platforms, plat] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setFormErrors({});
    setSaveSuccess(null);
    setErrorMessage(null);

    // Validate using Zod schema
    const validation = updateBusinessSchema.safeParse({
      name: formData.name,
      niche: formData.niche,
      city: formData.city,
      area: formData.area || undefined,
      budget_pkr: Number(formData.budget_pkr),
      hours_per_week: Number(formData.hours_per_week),
      tone: formData.tone,
      languages: formData.languages,
      platforms: formData.platforms,
      target_customer: formData.target_customer || undefined,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setFormErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await BusinessService.updateBusinessApiV1BusinessesBusinessIdPatch({
        businessId: business.id,
        requestBody: {
          name: validation.data.name,
          niche: validation.data.niche,
          city: validation.data.city,
          area: validation.data.area || null,
          budget_pkr: validation.data.budget_pkr ?? null,
          hours_per_week: validation.data.hours_per_week ?? null,
          tone: validation.data.tone,
          languages: validation.data.languages,
          platforms: validation.data.platforms,
          target_customer: validation.data.target_customer || null,
        },
      });

      setBusiness(updated);
      setIsEditing(false);
      setSaveSuccess("Business profile updated successfully.");
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(
        errorObj?.message || "Failed to save profile changes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      pageTitle="Business Profile"
      actions={
        business && !isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && <LoadingState message="Loading your business profile..." />}

        {/* 404 Not Found - Prompt Onboarding */}
        {!isLoading && notFound && (
          <EmptyState
            title="No business profile found"
            description="You haven't set up your business profile yet. Start our AI Onboarding to quickly answer a few questions and generate your full business plan."
            icon={<Sparkles className="w-6 h-6 text-[var(--color-accent)]" />}
            action={
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                <span>Start AI Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        )}

        {/* Generic Error State */}
        {!isLoading && !notFound && errorMessage && !business && (
          <ErrorState message={errorMessage} onRetry={refetch} />
        )}

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div
            role="status"
            className="flex items-center gap-2.5 p-3.5 rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Error Alert Banner when business exists */}
        {errorMessage && business && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-3.5 rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/10 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* View Mode */}
        {!isLoading && business && !isEditing && (
          <div className="space-y-6">
            {/* Header Hero Banner */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[var(--color-fg)]">
                      {business.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg-muted)]">
                      {NICHE_LABELS[business.niche] || business.niche}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {business.city}
                      {business.area ? `, ${business.area}` : ""}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-border)]/40 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-[var(--color-fg-muted)]" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Operational & Budget */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Budget & Commitment</span>
                </h3>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-canvas)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-fg-muted)]">Monthly Budget</p>
                    <p className="text-base font-bold text-[var(--color-fg)] mt-1">
                      {formatPKR(business.budget_pkr)}
                    </p>
                  </div>

                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-canvas)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-fg-muted)]">Weekly Time</p>
                    <p className="text-base font-bold text-[var(--color-fg)] mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
                      <span>{business.hours_per_week} hrs/week</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand & Tone */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Brand Identity & Languages</span>
                </h3>

                <div className="space-y-3 pt-1">
                  <div>
                    <p className="text-xs text-[var(--color-fg-muted)] mb-1">
                      Brand Tone
                    </p>
                    <span className="inline-block px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)]">
                      {TONE_LABELS[business.tone] || business.tone}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--color-fg-muted)] mb-1">
                      Communication Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {business.languages?.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                        >
                          {LANGUAGE_LABELS[lang] || lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Channels */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Marketing Platforms</span>
                </h3>

                <div className="flex flex-wrap gap-2 pt-1">
                  {business.platforms && business.platforms.length > 0 ? (
                    business.platforms.map((plat) => (
                      <span
                        key={plat}
                        className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                        {PLATFORM_LABELS[plat] || plat}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      No platforms selected
                    </p>
                  )}
                </div>
              </div>

              {/* Target Customer Persona */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Target Customer Persona</span>
                </h3>

                <p className="text-sm text-[var(--color-fg)] bg-[var(--color-canvas)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] whitespace-pre-wrap">
                  {business.target_customer || "No target customer description added yet."}
                </p>
              </div>
            </div>

            {/* Timestamps footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-fg-subtle)] px-1">
              <span>Created: {business.created_at ? formatDateTime(business.created_at) : "—"}</span>
              {business.updated_at && (
                <span>Last updated: {formatDateTime(business.updated_at)}</span>
              )}
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {!isLoading && business && isEditing && (
          <form
            onSubmit={handleSubmit}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] space-y-6"
          >
            <div className="border-b border-[var(--color-border)] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-fg)] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[var(--color-accent)]" />
                  <span>Edit Business Profile</span>
                </h2>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                  Update your business details, budget constraints, and marketing channels.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-canvas)] transition-colors"
                title="Cancel editing"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Business Name */}
              <FormField
                label="Business Name"
                name="name"
                required
                error={formErrors.name}
              >
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Gulshan Bakes"
                  hasError={Boolean(formErrors.name)}
                />
              </FormField>

              {/* Niche */}
              <FormField
                label="Industry / Niche"
                name="niche"
                required
                error={formErrors.niche}
              >
                <select
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="w-full h-[var(--control-md)] px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-border-focus)] transition-colors"
                >
                  {businessNiches.map((niche) => (
                    <option key={niche} value={niche}>
                      {NICHE_LABELS[niche] || niche}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* City */}
              <FormField
                label="City"
                name="city"
                required
                error={formErrors.city}
              >
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Karachi"
                  hasError={Boolean(formErrors.city)}
                />
              </FormField>

              {/* Area */}
              <FormField
                label="Area / Neighborhood"
                name="area"
                error={formErrors.area}
                hint="Local area or delivery zone"
              >
                <Input
                  id="area"
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g. Gulshan-e-Iqbal, Block 4"
                  hasError={Boolean(formErrors.area)}
                />
              </FormField>

              {/* Monthly Budget */}
              <FormField
                label="Monthly Budget (PKR)"
                name="budget_pkr"
                error={formErrors.budget_pkr}
                hint="Estimated monthly operating expenses"
              >
                <Input
                  id="budget_pkr"
                  type="number"
                  min="0"
                  max="10000000"
                  step="500"
                  value={formData.budget_pkr}
                  onChange={(e) => setFormData({ ...formData, budget_pkr: e.target.value })}
                  placeholder="25000"
                  hasError={Boolean(formErrors.budget_pkr)}
                />
              </FormField>

              {/* Weekly Time */}
              <FormField
                label="Available Time (Hours / Week)"
                name="hours_per_week"
                error={formErrors.hours_per_week}
                hint="Hours you can dedicate each week (0 - 168)"
              >
                <Input
                  id="hours_per_week"
                  type="number"
                  min="0"
                  max="168"
                  value={formData.hours_per_week}
                  onChange={(e) => setFormData({ ...formData, hours_per_week: e.target.value })}
                  placeholder="20"
                  hasError={Boolean(formErrors.hours_per_week)}
                />
              </FormField>

              {/* Tone */}
              <FormField
                label="Brand Tone"
                name="tone"
                required
                error={formErrors.tone}
              >
                <select
                  id="tone"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full h-[var(--control-md)] px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-border-focus)] transition-colors"
                >
                  {businessTones.map((tone) => (
                    <option key={tone} value={tone}>
                      {TONE_LABELS[tone] || tone}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Communication Languages */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-fg-muted)] tracking-wide">
                  Languages <span className="text-[var(--color-danger)]">*</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {businessLanguages.map((lang) => {
                    const isSelected = formData.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] border-[var(--color-accent)]"
                            : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:border-[var(--color-border-focus)]"
                        }`}
                      >
                        {LANGUAGE_LABELS[lang] || lang}
                      </button>
                    );
                  })}
                </div>
                {formErrors.languages && (
                  <p role="alert" className="text-xs text-[var(--color-danger)] mt-1">
                    {formErrors.languages}
                  </p>
                )}
              </div>
            </div>

            {/* Target Marketing Platforms */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-fg-muted)] tracking-wide">
                Target Marketing Platforms
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {businessPlatforms.map((plat) => {
                  const isSelected = formData.platforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => togglePlatform(plat)}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] border-[var(--color-accent)]"
                          : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:border-[var(--color-border-focus)]"
                      }`}
                    >
                      {PLATFORM_LABELS[plat] || plat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Customer Persona Description */}
            <FormField
              label="Target Customer Persona"
              name="target_customer"
              error={formErrors.target_customer}
              hint="Describe who buys from you, their preferences, and demographic"
            >
              <textarea
                id="target_customer"
                rows={3}
                value={formData.target_customer}
                onChange={(e) => setFormData({ ...formData, target_customer: e.target.value })}
                placeholder="e.g. Working women and homemakers in Gulshan looking for freshly baked customized birthday cakes and cupcakes."
                className="w-full p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none focus:border-[var(--color-border-focus)] transition-colors"
              />
            </FormField>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-border)]/30 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
