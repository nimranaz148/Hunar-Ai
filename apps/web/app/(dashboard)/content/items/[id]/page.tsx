"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Save,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Video,
  Layers,
  Image as ImageIcon,
  Compass,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentItemResponse,
  type UpdateContentItemRequest,
} from "@/lib/api";

function formatPromptToText(prompt: Record<string, unknown> | null | undefined): string {
  if (!prompt || typeof prompt !== "object" || Object.keys(prompt).length === 0) {
    return "";
  }
  const val = prompt.prompt || prompt.description || prompt.concept;
  return typeof val === "string" ? val : JSON.stringify(prompt, null, 2);
}

export default function ContentItemEditorPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [item, setItem] = useState<ContentItemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [cta, setCta] = useState("");
  const [hashtagsText, setHashtagsText] = useState("");
  const [bestTimeHint, setBestTimeHint] = useState("");
  const [imagePromptText, setImagePromptText] = useState("");
  const [videoPromptText, setVideoPromptText] = useState("");
  const [altText, setAltText] = useState("");
  const [statusVal, setStatusVal] = useState("draft");
  const [itemDate, setItemDate] = useState("");

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id && itemId) {
        const itemData =
          await ContentService.getItemApiV1BusinessesBusinessIdContentItemsItemIdGet({
            businessId: biz.id,
            itemId,
          });
        setItem(itemData);
        setHook(itemData.hook || "");
        setCaption(itemData.caption || "");
        setCta(itemData.cta || "");
        setHashtagsText((itemData.hashtags || []).join(" "));
        setBestTimeHint(itemData.best_time_hint || "");
        setImagePromptText(formatPromptToText(itemData.image_prompt));
        setVideoPromptText(formatPromptToText(itemData.video_prompt));
        setAltText(itemData.alt_text || "");
        setStatusVal(itemData.status || "draft");
        setItemDate(itemData.date || "");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load content item";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadItem();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadItem]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!business?.id || !itemId) return;

    setIsSaving(true);
    setErrorMessage(null);

    const parsedHashtags = hashtagsText
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

    const payload: UpdateContentItemRequest = {
      hook: hook.trim(),
      caption: caption.trim(),
      cta: cta.trim(),
      hashtags: parsedHashtags,
      best_time_hint: bestTimeHint.trim() || undefined,
      image_prompt: imagePromptText.trim() ? { prompt: imagePromptText.trim() } : undefined,
      video_prompt: videoPromptText.trim() ? { prompt: videoPromptText.trim() } : undefined,
      alt_text: altText.trim() || undefined,
      status: statusVal,
      date: itemDate || undefined,
    };

    try {
      const updated =
        await ContentService.updateItemApiV1BusinessesBusinessIdContentItemsItemIdPut({
          businessId: business.id,
          itemId,
          requestBody: payload,
        });

      setItem(updated);
      setToastMessage("Content item updated successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save content item";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt.toLowerCase()) {
      case "reel":
        return <Video className="w-4 h-4 text-purple-600" />;
      case "carousel":
        return <Layers className="w-4 h-4 text-blue-600" />;
      case "story":
        return <Compass className="w-4 h-4 text-amber-600" />;
      case "static":
      default:
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div
            role="status"
            className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-success-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] text-sm font-medium text-[var(--color-success)] animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Back navigation and header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="space-y-1">
            <Link
              href="/content/calendar"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Content Calendar
            </Link>

            <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[var(--color-accent)]" />
              {item ? `Day ${item.day} — Content Editor` : "Content Item Editor"}
            </h1>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Refine your post hooks, copy, strategic hashtags, and visual production directions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/content/calendar")}
              className="px-4 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving || isLoading || !item}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-[var(--color-fg-inverse)] bg-[var(--color-accent)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] rounded-[var(--radius-lg)] text-[var(--color-danger)] text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm">Action failed</h2>
              <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => loadItem()}
              className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded text-xs font-medium hover:bg-[var(--color-surface-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !item && (
          <LoadingState message="Loading content item details..." />
        )}

        {/* Empty State */}
        {!isLoading && !item && !errorMessage && (
          <EmptyState
            title="Content Item Not Found"
            description="The requested post could not be found in your 30-day calendar."
            action={
              <Link
                href="/content/calendar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-semibold rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition"
              >
                Return to Calendar
              </Link>
            }
          />
        )}

        {item && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Top Metadata Bar */}
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
              <div>
                <span className="text-2xs font-bold text-[var(--color-fg-subtle)] uppercase tracking-wider block">
                  Campaign Day
                </span>
                <span className="text-base font-black text-[var(--color-fg)] mt-0.5 block">
                  Day {item.day}
                </span>
              </div>

              <div>
                <span className="text-2xs font-bold text-[var(--color-fg-subtle)] uppercase tracking-wider block">
                  Format & Pillar
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getFormatIcon(item.format)}
                  <span className="text-xs font-semibold capitalize text-[var(--color-fg)]">
                    {item.format} · {item.pillar.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="item-date-input"
                  className="text-2xs font-bold text-[var(--color-fg-subtle)] uppercase tracking-wider block"
                >
                  Scheduled Date
                </label>
                <input
                  id="item-date-input"
                  type="date"
                  value={itemDate}
                  onChange={(e) => setItemDate(e.target.value)}
                  className="mt-1 px-2.5 py-1 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] w-full focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div>
                <label
                  htmlFor="status-select"
                  className="text-2xs font-bold text-[var(--color-fg-subtle)] uppercase tracking-wider block"
                >
                  Status
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    id="status-select"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="px-2.5 py-1 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="posted">Posted</option>
                    <option value="skipped">Skipped</option>
                  </select>
                  <StatusBadge status={statusVal} />
                </div>
              </div>
            </div>

            {/* Post Copy & Hook Editor */}
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
              <h2 className="text-sm font-bold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                Post Copy & Messaging
              </h2>

              {/* Hook */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="hook-input"
                    className="text-xs font-bold text-[var(--color-fg)]"
                  >
                    Hook / Opening Line
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hook, "hook")}
                    className="inline-flex items-center gap-1 text-2xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {copiedField === "hook" ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Hook</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="hook-input"
                  type="text"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="e.g. Dekhein kaisay banta hai pure raw silk dupatta"
                  className="w-full px-3 py-2 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              {/* Full Caption */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="caption-textarea"
                    className="text-xs font-bold text-[var(--color-fg)]"
                  >
                    Caption (Roman Urdu / English)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(caption, "caption")}
                    className="inline-flex items-center gap-1 text-2xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {copiedField === "caption" ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="caption-textarea"
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter full post caption..."
                  className="w-full p-3 text-xs text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)] leading-relaxed"
                />
                <span className="text-2xs text-[var(--color-fg-muted)] block text-right">
                  {caption.length} characters
                </span>
              </div>

              {/* CTA & Best Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="cta-input"
                    className="text-xs font-bold text-[var(--color-fg)]"
                  >
                    Call To Action (CTA)
                  </label>
                  <input
                    id="cta-input"
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="e.g. Order on WhatsApp: 0300-1234567"
                    className="w-full px-3 py-2 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="best-time-input"
                    className="text-xs font-bold text-[var(--color-fg)]"
                  >
                    Best Posting Time
                  </label>
                  <input
                    id="best-time-input"
                    type="text"
                    value={bestTimeHint}
                    onChange={(e) => setBestTimeHint(e.target.value)}
                    placeholder="e.g. 7:00 PM - 9:00 PM PKT"
                    className="w-full px-3 py-2 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              {/* Hashtags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="hashtags-input"
                    className="text-xs font-bold text-[var(--color-fg)]"
                  >
                    Strategic Hashtags (space or comma separated)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hashtagsText, "hashtags")}
                    className="inline-flex items-center gap-1 text-2xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {copiedField === "hashtags" ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Hashtags</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="hashtags-input"
                  type="text"
                  value={hashtagsText}
                  onChange={(e) => setHashtagsText(e.target.value)}
                  placeholder="#pakistanifashion #handmade #lahore"
                  className="w-full px-3 py-2 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* Visual Production Directives */}
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
              <h2 className="text-sm font-bold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Visual Production Directives
              </h2>

              {/* Image Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="image-prompt-textarea"
                    className="text-xs font-bold text-[var(--color-fg)] flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    AI Image Generation Prompt / Photography Directive
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(imagePromptText, "image_prompt")}
                    className="inline-flex items-center gap-1 text-2xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {copiedField === "image_prompt" ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="image-prompt-textarea"
                  rows={3}
                  value={imagePromptText}
                  onChange={(e) => setImagePromptText(e.target.value)}
                  placeholder="Detailed visual prompt description..."
                  className="w-full p-3 text-xs text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)] leading-relaxed italic"
                />
              </div>

              {/* Video Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="video-prompt-textarea"
                    className="text-xs font-bold text-[var(--color-fg)] flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    Reel / Video Storyboard Script
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(videoPromptText, "video_prompt")}
                    className="inline-flex items-center gap-1 text-2xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {copiedField === "video_prompt" ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="video-prompt-textarea"
                  rows={3}
                  value={videoPromptText}
                  onChange={(e) => setVideoPromptText(e.target.value)}
                  placeholder="Storyboard scenes, cuts, audio direction..."
                  className="w-full p-3 text-xs text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)] leading-relaxed italic"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1.5">
                <label
                  htmlFor="alt-text-input"
                  className="text-xs font-bold text-[var(--color-fg)]"
                >
                  Accessibility Alt Text
                </label>
                <input
                  id="alt-text-input"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Concise description of the image for screen readers"
                  className="w-full px-3 py-2 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => router.push("/content/calendar")}
                className="px-5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold text-[var(--color-fg-inverse)] bg-[var(--color-accent)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
