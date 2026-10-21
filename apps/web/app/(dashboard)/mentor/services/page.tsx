"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Layers,
  Power,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPKR } from "@/lib/format";
import {
  MentorsService,
  type MentorServiceResponse,
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

const SERVICE_TYPES = [
  { id: "session", label: "1-on-1 Session" },
  { id: "review", label: "Review & Audit" },
  { id: "done_with_you", label: "Done-With-You Coaching" },
  { id: "package", label: "Mentorship Package" },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180];

export default function MentorServicesPage() {
  const [services, setServices] = useState<MentorServiceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState("handmade");
  const [serviceType, setServiceType] = useState("session");
  const [pricePkr, setPricePkr] = useState<number>(3000);
  const [durationMin, setDurationMin] = useState<number>(60);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingService, setDeletingService] = useState<MentorServiceResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadServices() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await MentorsService.listOwnMentorServicesApiV1MentorsMeServicesGet();
        if (!ignore) {
          setServices(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setErrorMessage(err.body?.detail || "Failed to load mentor services.");
          } else {
            setErrorMessage("An unexpected error occurred while loading services.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      ignore = true;
    };
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setTitle("");
    setDescription("");
    setNiche("handmade");
    setServiceType("session");
    setPricePkr(3000);
    setDurationMin(60);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (svc: MentorServiceResponse) => {
    setModalMode("edit");
    setEditingId(svc.id);
    setTitle(svc.title);
    setDescription(svc.description);
    setNiche(svc.niche);
    setServiceType(svc.type);
    setPricePkr(svc.price_pkr);
    setDurationMin(svc.duration_min);
    setIsActive(svc.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 2 || title.trim().length > 200) {
      setFormError("Title must be between 2 and 200 characters.");
      return;
    }
    if (description.trim().length < 10 || description.trim().length > 1000) {
      setFormError("Description must be between 10 and 1000 characters.");
      return;
    }
    if (pricePkr <= 0) {
      setFormError("Price in PKR must be greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === "create") {
        const created = await MentorsService.createOwnMentorServiceApiV1MentorsMeServicesPost({
          requestBody: {
            title: title.trim(),
            description: description.trim(),
            niche,
            type: serviceType,
            price_pkr: pricePkr,
            duration_min: durationMin,
            active: isActive,
          },
        });
        setServices((prev) => [created, ...prev]);
        setSuccessMessage(`Service "${created.title}" created successfully!`);
      } else if (editingId) {
        const updated = await MentorsService.updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch({
          serviceId: editingId,
          requestBody: {
            title: title.trim(),
            description: description.trim(),
            niche,
            type: serviceType,
            price_pkr: pricePkr,
            duration_min: durationMin,
            active: isActive,
          },
        });
        setServices((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSuccessMessage(`Service "${updated.title}" updated successfully!`);
      }
      closeModal();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.body?.detail || "Failed to save service changes.");
      } else {
        setFormError("An unexpected error occurred while saving service.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (svc: MentorServiceResponse) => {
    try {
      const updated = await MentorsService.updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch({
        serviceId: svc.id,
        requestBody: {
          active: !svc.active,
        },
      });
      setServices((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setSuccessMessage(
        `Service "${updated.title}" is now ${updated.active ? "Active" : "Paused"}.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.body?.detail || "Failed to update service status.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    setIsDeleting(true);

    try {
      await MentorsService.deleteOwnMentorServiceApiV1MentorsMeServicesServiceIdDelete({
        serviceId: deletingService.id,
      });
      setServices((prev) => prev.filter((item) => item.id !== deletingService.id));
      setSuccessMessage(`Service "${deletingService.title}" was successfully deleted.`);
      setDeletingService(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.body?.detail || "Failed to delete service.");
      } else {
        setErrorMessage("An unexpected error occurred while deleting service.");
      }
      setDeletingService(null);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = services.filter((s) => s.active).length;
  const avgPrice =
    services.length > 0
      ? Math.round(
          services.reduce((acc, curr) => acc + curr.price_pkr, 0) / services.length
        )
      : 0;

  return (
    <AppShell role="mentor">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Phase 3 — Mentor Pro Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-fg)] mt-1">
              My Advisory Services
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              Configure 1-on-1 calls, audits, and mentorship offerings for Pakistani entrepreneurs.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm transition-colors shadow-[var(--shadow-sm)] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-[var(--radius-md)] flex items-center gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
              <span>Total Services</span>
              <Layers className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--color-fg)] mt-2">
              {services.length}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
              <span>Active Offerings</span>
              <Power className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              {activeCount}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
              <span>Average Fee</span>
              <Briefcase className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--color-fg)] mt-2">
              {formatPKR(avgPrice)}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
            <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
            <div className="h-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && services.length === 0 && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-fg-muted)]">
              <Briefcase className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--color-fg)]">
                No Services Created Yet
              </h3>
              <p className="text-sm text-[var(--color-fg-muted)] max-w-md mx-auto">
                Offer your industry expertise to entrepreneurs by creating 1-on-1 strategy sessions, pricing reviews, or mentorship packages.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Service</span>
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => {
              const nicheObj = AVAILABLE_NICHES.find((n) => n.id === svc.niche);
              const typeObj = SERVICE_TYPES.find((t) => t.id === svc.type);

              return (
                <div
                  key={svc.id}
                  className={`bg-[var(--color-surface)] border rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] flex flex-col justify-between transition-all ${
                    svc.active
                      ? "border-[var(--color-border)]"
                      : "border-[var(--color-border)]/60 opacity-75"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Type & Active Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-[var(--color-fg-muted)] border border-[var(--color-border)]">
                        {typeObj?.label || svc.type}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(svc)}
                        title={svc.active ? "Click to Pause" : "Click to Activate"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold uppercase transition-colors ${
                          svc.active
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            svc.active ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{svc.active ? "Active" : "Paused"}</span>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-fg)] line-clamp-2">
                        {svc.title}
                      </h3>
                      <p className="text-xs text-[var(--color-fg-muted)] mt-2 line-clamp-3 leading-relaxed">
                        {svc.description}
                      </p>
                    </div>

                    {/* Niche & Duration Meta */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-2xs text-[var(--color-fg-subtle)]">
                      <span className="bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)]">
                        {nicheObj?.label || svc.niche}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--color-fg-muted)]">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-fg-subtle)]" />
                        <span>{svc.duration_min} min</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Price & Actions */}
                  <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <span className="text-2xs text-[var(--color-fg-subtle)] uppercase tracking-wider block">
                        Fee (PKR)
                      </span>
                      <span className="text-base font-bold text-[var(--color-fg)]">
                        {formatPKR(svc.price_pkr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(svc)}
                        className="p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        title="Edit Service"
                        aria-label={`Edit ${svc.title}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingService(svc)}
                        className="p-2 rounded-[var(--radius-md)] border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete Service"
                        aria-label={`Delete ${svc.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create / Edit Service */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] max-w-xl w-full p-6 sm:p-8 shadow-[var(--shadow-xl)] space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div>
                  <h2
                    id="service-modal-title"
                    className="text-lg font-bold text-[var(--color-fg)]"
                  >
                    {modalMode === "create" ? "Add New Advisory Service" : "Edit Advisory Service"}
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                    Configure service title, specialty niche, duration, and price in PKR.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3.5 rounded-[var(--radius-md)] flex items-center gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveService} className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="service-title-input"
                    className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                  >
                    Service Title *
                  </label>
                  <input
                    id="service-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 1-on-1 Product Pricing Strategy"
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                  <div className="flex justify-between text-2xs text-[var(--color-fg-subtle)] mt-1">
                    <span>Clear, outcome-driven title for entrepreneurs.</span>
                    <span>{title.length}/200</span>
                  </div>
                </div>

                {/* Niche & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="service-niche-select"
                      className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                    >
                      Specialty / Niche *
                    </label>
                    <select
                      id="service-niche-select"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      {AVAILABLE_NICHES.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="service-type-select"
                      className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                    >
                      Service Format *
                    </label>
                    <select
                      id="service-type-select"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      {SERVICE_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="service-price-input"
                      className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                    >
                      Price (PKR) *
                    </label>
                    <input
                      id="service-price-input"
                      type="number"
                      required
                      min={1}
                      step={100}
                      value={pricePkr}
                      onChange={(e) => setPricePkr(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                    <p className="text-2xs text-[var(--color-fg-subtle)] mt-1">
                      Protected via simulated escrow checkout.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="service-duration-select"
                      className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                    >
                      Duration (Minutes) *
                    </label>
                    <select
                      id="service-duration-select"
                      value={durationMin}
                      onChange={(e) => setDurationMin(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      {DURATION_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} minutes ({m >= 60 ? `${(m / 60).toFixed(1)} hrs` : `${m}m`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="service-desc-textarea"
                    className="block text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1"
                  >
                    Service Description *
                  </label>
                  <textarea
                    id="service-desc-textarea"
                    rows={4}
                    required
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what the entrepreneur gets, deliverables, and how you will work together..."
                    className="w-full p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                  <div className="flex justify-between text-2xs text-[var(--color-fg-subtle)] mt-1">
                    <span>10 to 1000 characters.</span>
                    <span>{description.length}/1000</span>
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="service-active-toggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[var(--color-border)]"
                  />
                  <label
                    htmlFor="service-active-toggle"
                    className="text-xs font-medium text-[var(--color-fg)] select-none"
                  >
                    Active for new client bookings
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm transition-colors shadow-[var(--shadow-sm)] disabled:opacity-50"
                  >
                    {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{isSubmitting ? "Saving..." : "Save Service"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deletingService && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] max-w-md w-full p-6 shadow-[var(--shadow-xl)] space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 id="delete-modal-title" className="text-base font-bold text-[var(--color-fg)]">
                  Delete Advisory Service?
                </h3>
              </div>

              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[var(--color-fg)]">
                  &quot;{deletingService.title}&quot;
                </span>
                ? This cannot be undone. If there are active booked sessions for this service, you must pause availability instead.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDeletingService(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-red-600 text-white hover:bg-red-700 font-semibold text-sm transition-colors shadow-[var(--shadow-sm)] disabled:opacity-50"
                >
                  {isDeleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isDeleting ? "Deleting..." : "Delete Service"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
