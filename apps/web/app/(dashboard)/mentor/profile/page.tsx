"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  MapPin,
  Globe,
  Award,
  Sparkles,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Star,
  RefreshCw,
  Camera,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  MentorsService,
  type MentorProfileResponse,
  ApiError,
} from "@/lib/api";

const AVAILABLE_NICHES = [
  { id: "handmade", label: "Handmade Crafts" },
  { id: "stitching_fashion", label: "Stitching & Fashion" },
  { id: "food", label: "Food & Baking" },
  { id: "beauty", label: "Beauty & Skincare" },
  { id: "tutoring", label: "Tutoring & Coaching" },
  { id: "digital", label: "Digital Services & Marketing" },
];

const AVAILABLE_LANGUAGES = [
  { id: "ur", label: "Urdu (اردو)" },
  { id: "roman_ur", label: "Roman Urdu" },
  { id: "en", label: "English" },
  { id: "sd", label: "Sindhi (سنڌي)" },
  { id: "pa", label: "Punjabi (پنجابی)" },
  { id: "ps", label: "Pashto (پښتو)" },
];

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Hyderabad",
  "Gujranwala",
  "Remote / Across Pakistan",
];

export default function MentorProfilePage() {
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [city, setCity] = useState("Lahore");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await MentorsService.getOwnMentorProfileApiV1MentorsMeGet();
        if (!ignore) {
          setProfile(data);
          setCity(data.city || "Lahore");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || "");
          setSelectedNiches(data.niches || []);
          setSelectedLanguages(data.languages || ["ur", "en"]);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setErrorMessage(err.body?.detail || "Failed to load mentor profile.");
          } else {
            setErrorMessage("An unexpected error occurred while loading profile.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const handleReset = () => {
    if (!profile) return;
    setCity(profile.city || "Lahore");
    setBio(profile.bio || "");
    setAvatarUrl(profile.avatar_url || "");
    setSelectedNiches(profile.niches || []);
    setSelectedLanguages(profile.languages || ["ur", "en"]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const toggleNiche = (id: string) => {
    setSelectedNiches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (id: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim()) {
      setErrorMessage("Bio cannot be empty. Please describe your mentoring expertise.");
      return;
    }
    if (selectedNiches.length === 0) {
      setErrorMessage("Please select at least one coaching specialty/niche.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await MentorsService.updateOwnMentorProfileApiV1MentorsMePatch({
        requestBody: {
          city,
          bio,
          avatar_url: avatarUrl.trim() || undefined,
          niches: selectedNiches,
          languages: selectedLanguages,
        },
      });

      setProfile(updated);
      setSuccessMessage("Your mentor profile has been successfully updated!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.body?.detail || "Failed to save profile changes.");
      } else {
        setErrorMessage("An unexpected error occurred while saving profile.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell role="mentor">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Phase 3 — Mentor Pro Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-fg)] mt-1">
              Mentor Profile Editor
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              Customize your public advisory profile, specialties, and bio for Pakistani entrepreneurs.
            </p>
          </div>

          {profile && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {profile.status.toUpperCase()}
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 rounded-[var(--radius-md)]">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{profile.rating.toFixed(1)}</span>
                <span className="text-[var(--color-fg-muted)] font-normal">
                  ({profile.review_count} reviews)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
            <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
          </div>
        )}

        {/* Form Body */}
        {!isLoading && profile && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Master Profile Card */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] space-y-6">
              <h2 className="text-base font-bold text-[var(--color-fg)] border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Account & Personal Overview</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.name}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-fg-muted)] text-sm cursor-not-allowed"
                  />
                  <p className="text-2xs text-[var(--color-fg-subtle)] mt-1">
                    Linked to your Hunar login credentials.
                  </p>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-fg-muted)] text-sm cursor-not-allowed"
                  />
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city-select"
                    className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                  >
                    Primary Location / City *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
                    <select
                      id="city-select"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar URL */}
                <div>
                  <label
                    htmlFor="avatar-url-input"
                    className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                  >
                    Avatar Image URL
                  </label>
                  <div className="relative">
                    <Camera className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
                    <input
                      id="avatar-url-input"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or hosted profile picture"
                      className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Specialties & Languages Card */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] space-y-6">
              <h2 className="text-base font-bold text-[var(--color-fg)] border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Specialties & Languages</span>
              </h2>

              {/* Niches Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                  Coaching Specialties / Niches * (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_NICHES.map((niche) => {
                    const isSelected = selectedNiches.includes(niche.id);
                    return (
                      <button
                        type="button"
                        key={niche.id}
                        onClick={() => toggleNiche(niche.id)}
                        className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] border-[var(--color-accent)] shadow-[var(--shadow-xs)]"
                            : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        {niche.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages Spoken */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                  Languages Spoken for Mentorship Calls *
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.id);
                    return (
                      <button
                        type="button"
                        key={lang.id}
                        onClick={() => toggleLanguage(lang.id)}
                        className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] border-[var(--color-accent)] shadow-[var(--shadow-xs)]"
                            : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        <Globe className="w-3 h-3 inline-block mr-1.5 opacity-80" />
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Professional Bio Card */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h2 className="text-base font-bold text-[var(--color-fg)] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Public Biography & Industry Track Record</span>
                </h2>
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  {bio.length} / 2000 characters
                </span>
              </div>

              <textarea
                rows={6}
                value={bio}
                maxLength={2000}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your business journey, past executive roles, accomplishments, and how you help Pakistani artisanal founders grow..."
                className="w-full p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Changes</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm transition-colors shadow-[var(--shadow-sm)] disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>

            {/* Audit / Status Panel */}
            <div className="bg-[var(--color-surface-hover)]/60 rounded-[var(--radius-md)] p-4 border border-[var(--color-border)]/50 text-xs text-[var(--color-fg-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span>Profile ID: </span>
                <span className="font-mono text-[var(--color-fg-muted)]">{profile.id}</span>
              </div>
              <div>
                <span>Created: </span>
                <span className="font-medium text-[var(--color-fg-muted)]">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
                {profile.updated_at && (
                  <span className="ml-3">
                    Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
