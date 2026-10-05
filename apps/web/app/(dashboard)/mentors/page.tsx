"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  X,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ServicesService,
  type MentorServiceItemResponse,
  type MentorServiceDetailResponse,
} from "@/lib/api";

const NICHES = [
  { id: "all", label: "All Specialties" },
  { id: "handmade", label: "Handmade Crafts" },
  { id: "stitching_fashion", label: "Stitching & Fashion" },
  { id: "food", label: "Food & Baking" },
  { id: "beauty", label: "Beauty & Skincare" },
  { id: "tutoring", label: "Tutoring & Coaching" },
  { id: "digital", label: "Digital & Social Media" },
];

const SERVICE_TYPES = [
  { id: "all", label: "All Formats" },
  { id: "session", label: "1-on-1 Strategy Session" },
  { id: "review", label: "Catalog / Profile Audit" },
  { id: "done_with_you", label: "Done-With-You Setup" },
  { id: "package", label: "Full Growth Package" },
];

export default function BrowseMentorsPage() {
  const [services, setServices] = useState<MentorServiceItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  // Slide-over detail state
  const [selectedService, setSelectedService] = useState<MentorServiceDetailResponse | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const resp = await ServicesService.browseServicesApiV1ServicesGet({
          niche: selectedNiche !== "all" ? selectedNiche : undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
          search: searchQuery.trim() || undefined,
          page: 1,
          pageSize: 50,
        });
        if (!ignore) {
          setServices(resp.items || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load mentor services:", err);
          setErrorMessage("Could not load mentor services. Please check your connection and try again.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [selectedNiche, selectedType, maxPrice, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const resp = await ServicesService.browseServicesApiV1ServicesGet({
        niche: selectedNiche !== "all" ? selectedNiche : undefined,
        type: selectedType !== "all" ? selectedType : undefined,
        maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
        search: searchQuery.trim() || undefined,
        page: 1,
        pageSize: 50,
      });
      setServices(resp.items || []);
    } catch (err) {
      console.error("Failed to refresh mentor services:", err);
      setErrorMessage("Could not load mentor services. Please check your connection and try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDetail = async (serviceId: string) => {
    try {
      const detail = await ServicesService.getServiceApiV1ServicesServiceIdGet({
        serviceId,
      });
      setSelectedService(detail);
    } catch (err) {
      console.error("Failed to fetch service detail:", err);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedNiche("all");
    setSelectedType("all");
    setMaxPrice("");
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedNiche !== "all" || selectedType !== "all" || maxPrice !== "";

  const formatNicheLabel = (id: string) => {
    const found = NICHES.find((n) => n.id === id);
    return found ? found.label : id.replace(/_/g, " ");
  };

  const formatTypeLabel = (id: string) => {
    const found = SERVICE_TYPES.find((t) => t.id === id);
    return found ? found.label : id.replace(/_/g, " ");
  };

  return (
    <AppShell role="entrepreneur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Phase 3 — Mentor Pro Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-fg)] mt-1">
              Browse Mentor Services
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              Connect with vetted Pakistani industry mentors for 1-on-1 strategy sessions, pricing reviews, and customized growth packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
              aria-label="Refresh mentor catalog"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, mentors, or keywords..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Service Type Select */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                aria-label="Filter by service format"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Budget Input */}
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-fg-subtle)]">
                  Max PKR
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 5000"
                  className="w-full pl-20 pr-4 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>
          </div>

          {/* Niche Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
            <span className="text-xs font-medium text-[var(--color-fg-subtle)] whitespace-nowrap mr-1">
              Specialty:
            </span>
            {NICHES.map((niche) => {
              const isSelected = selectedNiche === niche.id;
              return (
                <button
                  key={niche.id}
                  onClick={() => setSelectedNiche(niche.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] shadow-[var(--shadow-xs)]"
                      : "bg-[var(--color-surface-subtle)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
                  }`}
                >
                  {niche.label}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[var(--color-accent)] hover:underline ml-auto whitespace-nowrap pl-3"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] flex items-center gap-3 text-sm text-[var(--color-danger)]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Catalog Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-72 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-surface-subtle)]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-[var(--color-surface-subtle)] rounded w-2/3" />
                      <div className="h-3 bg-[var(--color-surface-subtle)] rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-5 bg-[var(--color-surface-subtle)] rounded w-5/6" />
                  <div className="h-12 bg-[var(--color-surface-subtle)] rounded" />
                </div>
                <div className="h-8 bg-[var(--color-surface-subtle)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            title="No mentor services found"
            description={
              hasActiveFilters
                ? "Try adjusting your search criteria or resetting filters to discover more guidance offerings."
                : "No active mentor services are published yet. Check back soon!"
            }
            action={
              hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Clear All Filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)] px-1">
              <span>
                Showing <strong>{services.length}</strong> active coaching services
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="group bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Mentor Profile Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold text-base border border-[var(--color-border)] overflow-hidden flex-shrink-0">
                          {svc.mentor_avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={svc.mentor_avatar_url}
                              alt={svc.mentor_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{svc.mentor_name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-[var(--color-fg)] leading-tight">
                              {svc.mentor_name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)] mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{svc.mentor_city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating Badge */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-fg)]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{svc.mentor_rating.toFixed(1)}</span>
                        <span className="text-[var(--color-fg-subtle)] font-normal">
                          ({svc.mentor_review_count})
                        </span>
                      </div>
                    </div>

                    {/* Service Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                        {formatNicheLabel(svc.niche)}
                      </span>
                      <span className="px-2 py-0.5 text-2xs font-medium rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] text-[var(--color-fg-muted)] border border-[var(--color-border)]">
                        {formatTypeLabel(svc.type)}
                      </span>
                    </div>

                    {/* Service Title & Description */}
                    <div>
                      <h3 className="font-bold text-base text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                        {svc.title}
                      </h3>
                      <p className="text-xs text-[var(--color-fg-muted)] mt-1.5 line-clamp-3 leading-relaxed">
                        {svc.description}
                      </p>
                    </div>

                    {/* Metadata Pill */}
                    <div className="flex items-center gap-3 text-xs text-[var(--color-fg-subtle)] pt-1 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
                        <span>{svc.duration_min} minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Price & Action */}
                  <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-2xs uppercase tracking-wider text-[var(--color-fg-subtle)] font-medium block">
                        Fee
                      </span>
                      <span className="text-lg font-bold text-[var(--color-fg)]">
                        Rs {svc.price_pkr.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetail(svc.id)}
                        className="px-3 py-2 text-xs font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] transition-colors"
                        aria-label={`View details for ${svc.title}`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenDetail(svc.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] transition-colors"
                        aria-label={`Book session for ${svc.title}`}
                      >
                        <span>Book</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide-over Service Detail Modal */}
        {selectedService && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-drawer-title"
          >
            <div className="w-full max-w-lg bg-[var(--color-surface)] h-full shadow-2xl border-l border-[var(--color-border)] flex flex-col justify-between overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                    <span>{formatNicheLabel(selectedService.niche)}</span>
                    <span>•</span>
                    <span>{formatTypeLabel(selectedService.type)}</span>
                  </div>
                  <h2
                    id="service-drawer-title"
                    className="text-xl font-bold text-[var(--color-fg)] mt-1"
                  >
                    {selectedService.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
                  aria-label="Close service detail"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* Mentor Card in Drawer */}
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold text-lg border border-[var(--color-border)] overflow-hidden flex-shrink-0">
                    {selectedService.mentor_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedService.mentor_avatar_url}
                        alt={selectedService.mentor_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{selectedService.mentor_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[var(--color-fg)]">
                          {selectedService.mentor_name}
                        </span>
                        <BadgeCheck className="w-4 h-4 text-[var(--color-accent)]" />
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-fg)]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{selectedService.mentor_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedService.mentor_city}, Pakistan</span>
                    </div>
                    {selectedService.mentor_bio && (
                      <p className="text-xs text-[var(--color-fg-muted)] pt-2 leading-relaxed">
                        {selectedService.mentor_bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-subtle)]">
                    What this session includes
                  </h4>
                  <div className="text-sm text-[var(--color-fg)] whitespace-pre-wrap leading-relaxed">
                    {selectedService.description}
                  </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <span className="text-2xs uppercase text-[var(--color-fg-subtle)] font-medium block">
                      Duration
                    </span>
                    <span className="font-bold text-sm text-[var(--color-fg)] mt-0.5 block">
                      {selectedService.duration_min} Minutes
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <span className="text-2xs uppercase text-[var(--color-fg-subtle)] font-medium block">
                      Investment
                    </span>
                    <span className="font-bold text-sm text-[var(--color-fg)] mt-0.5 block">
                      Rs {selectedService.price_pkr.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Languages Supported */}
                {selectedService.mentor_languages && selectedService.mentor_languages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-2xs uppercase text-[var(--color-fg-subtle)] font-medium block">
                      Languages Spoken
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedService.mentor_languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs text-[var(--color-fg)] font-medium"
                        >
                          {lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Action Footer */}
              <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] flex items-center justify-between gap-4">
                <div>
                  <span className="text-2xs uppercase text-[var(--color-fg-subtle)] font-medium block">
                    Session Fee
                  </span>
                  <span className="text-xl font-bold text-[var(--color-fg)]">
                    Rs {selectedService.price_pkr.toLocaleString()}
                  </span>
                </div>

                <Link
                  href={`/mentors/book?service_id=${selectedService.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm shadow-[var(--shadow-sm)] transition-colors"
                >
                  <span>Continue to Book</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
