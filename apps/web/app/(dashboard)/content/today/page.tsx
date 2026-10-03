"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
  RefreshCw,
  Video,
  Layers,
  Image as ImageIcon,
  Compass,
  AlertCircle,
  X,
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
} from "@/lib/api";

function formatPromptToText(prompt: Record<string, unknown> | null | undefined): string {
  if (!prompt || typeof prompt !== "object" || Object.keys(prompt).length === 0) {
    return "";
  }
  const val = prompt.prompt || prompt.description || prompt.concept;
  return typeof val === "string" ? val : JSON.stringify(prompt, null, 2);
}

export default function TodayPostPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [item, setItem] = useState<ContentItemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Mark as Posted Modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postUrlInput, setPostUrlInput] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const loadTodayItem = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const todayPost =
          await ContentService.getTodayItemApiV1BusinessesBusinessIdContentTodayGet({
            businessId: biz.id,
          });
        setItem(todayPost);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load today's post";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadTodayItem();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadTodayItem]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const handleMarkAsPosted = async () => {
    if (!business?.id || !item?.id) return;
    setIsSubmittingPost(true);
    try {
      const updated =
        await ContentService.postItemApiV1BusinessesBusinessIdContentItemsItemIdPostPost({
          businessId: business.id,
          itemId: item.id,
          requestBody: {
            post_url: postUrlInput.trim() || undefined,
          },
        });

      setItem(updated);
      setIsPostModalOpen(false);
      setToastMessage("Post marked as published on social media!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to record post status";
      setErrorMessage(msg);
    } finally {
      setIsSubmittingPost(false);
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

  const imagePromptText = item ? formatPromptToText(item.image_prompt) : "";
  const videoPromptText = item ? formatPromptToText(item.video_prompt) : "";

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[var(--text-2xs)] font-bold tracking-wide uppercase bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                Daily Posting Workflow
              </span>
              <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                F-013 Today View
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg)] mt-1 tracking-tight flex items-center gap-2">
              <Send className="w-6 h-6 text-[var(--color-accent)]" />
              Today&apos;s Post
            </h1>
            <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
              Copy your daily caption, hashtags, and visual prompts, post to Instagram/Facebook, and track publication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadTodayItem(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/content/calendar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
            >
              <Calendar className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
              Month Calendar
            </Link>
            {item && (
              <Link
                href={`/content/items/${item.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
                Edit Details
              </Link>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] rounded-[var(--radius-lg)] text-[var(--color-danger)] text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm">Unable to load today&apos;s post</h2>
              <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => loadTodayItem()}
              className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded text-xs font-medium hover:bg-[var(--color-surface-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !item && (
          <LoadingState message="Loading today's scheduled post..." />
        )}

        {/* Empty State */}
        {!isLoading && !item && !errorMessage && (
          <EmptyState
            title="No Post Scheduled for Today"
            description="You don't have an active post scheduled for today. Check your 30-day Content Calendar or generate a new month campaign."
            action={
              <Link
                href="/content/calendar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-semibold rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition"
              >
                View Content Calendar
              </Link>
            }
          />
        )}

        {item && (
          <div className="space-y-6">
            {/* Posted Banner if already published */}
            {item.status === "posted" && (
              <div className="p-4 bg-[var(--color-success-subtle)] border border-[var(--color-success-border)] rounded-[var(--radius-lg)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
                  <div>
                    <h2 className="text-xs font-bold text-[var(--color-success)] uppercase tracking-wider">
                      Post Published
                    </h2>
                    <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                      Published on {item.posted_at ? new Date(item.posted_at).toLocaleString() : "today"}
                    </p>
                  </div>
                </div>
                {item.post_url && (
                  <a
                    href={item.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
                  >
                    <span>View Live Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Post Header Card */}
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-black rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-[var(--color-fg)] border border-[var(--color-border)]">
                    Day {item.day}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-fg)]">
                    {getFormatIcon(item.format)}
                    <span className="capitalize">{item.format}</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                    {item.pillar.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.best_time_hint && (
                    <div className="flex items-center gap-1 text-[var(--text-2xs)] font-medium text-[var(--color-fg-muted)] bg-[var(--color-surface-hover)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                      <Clock className="w-3 h-3 text-[var(--color-accent)]" />
                      <span>{item.best_time_hint}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hook / Core Angle */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Opening Hook
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.hook || "", "hook")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {copiedField === "hook" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Hook</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-base font-bold text-[var(--color-fg)] leading-snug">
                  {item.hook}
                </p>
              </div>

              {/* Full Caption */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Full Caption
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.caption || "", "caption")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded-[var(--radius-md)] text-xs font-bold hover:bg-[var(--color-accent)] hover:text-[var(--color-fg-inverse)] transition"
                  >
                    {copiedField === "caption" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Caption!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Caption</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-fg)] whitespace-pre-wrap leading-relaxed font-normal">
                  {item.caption}
                </div>
              </div>

              {/* Call to Action */}
              {item.cta && (
                <div className="flex items-center justify-between p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs">
                  <span className="font-bold text-[var(--color-fg-muted)]">Call To Action (CTA):</span>
                  <span className="font-semibold text-[var(--color-accent)]">{item.cta}</span>
                </div>
              )}

              {/* Strategic Hashtags */}
              {item.hashtags && item.hashtags.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider">
                      Strategic Hashtags ({item.hashtags.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard((item.hashtags || []).join(" "), "hashtags")
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-fg)] rounded-[var(--radius-md)] text-xs font-bold hover:bg-[var(--color-surface)] transition"
                    >
                      {copiedField === "hashtags" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                          <span>Copied All!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                    {(item.hashtags || []).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[var(--text-2xs)] font-medium bg-[var(--color-surface)] text-[var(--color-accent)] rounded border border-[var(--color-border)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Prompts Directives */}
            {(imagePromptText || videoPromptText) && (
              <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] space-y-4">
                <h2 className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                  Visual Production Directives
                </h2>

                {imagePromptText && (
                  <div className="space-y-1.5 p-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-fg)] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        AI Image Generation Prompt / Photography Guide
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(imagePromptText, "image_prompt")}
                        className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                      >
                        {copiedField === "image_prompt" ? "Copied!" : "Copy Prompt"}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-fg-muted)] italic leading-relaxed">
                      &quot;{imagePromptText}&quot;
                    </p>
                  </div>
                )}

                {videoPromptText && (
                  <div className="space-y-1.5 p-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-fg)] flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        Reel Storyboard Script & Cut Angles
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(videoPromptText, "video_prompt")}
                        className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                      >
                        {copiedField === "video_prompt" ? "Copied!" : "Copy Script"}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-fg-muted)] italic leading-relaxed">
                      &quot;{videoPromptText}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mark as Posted Action Banner */}
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-fg)]">
                  Published this post on social media?
                </h2>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                  Marking as posted updates your campaign metrics and unlocks the next day post.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPostModalOpen(true)}
                disabled={item.status === "posted"}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-[var(--radius-md)] transition shadow-sm ${
                  item.status === "posted"
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-fg-muted)] border border-[var(--color-border)] cursor-not-allowed"
                    : "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {item.status === "posted" ? "Already Marked as Posted" : "Mark as Posted"}
              </button>
            </div>
          </div>
        )}

        {/* Modal: Confirm Mark as Posted */}
        {isPostModalOpen && item && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] max-w-md w-full p-6 shadow-2xl space-y-4 border border-[var(--color-border)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="post-modal-title" className="text-base font-bold text-[var(--color-fg)]">
                      Mark Day {item.day} as Posted
                    </h3>
                    <span className="text-xs text-[var(--color-fg-muted)]">
                      Confirm you published on Instagram or Facebook
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="post-url-modal-input"
                  className="text-xs font-bold text-[var(--color-fg)]"
                >
                  Live Post URL (Optional)
                </label>
                <input
                  id="post-url-modal-input"
                  type="url"
                  placeholder="https://www.instagram.com/p/..."
                  value={postUrlInput}
                  onChange={(e) => setPostUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                />
                <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] block">
                  You can paste the Instagram post link here for easy reference in your performance reports.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  disabled={isSubmittingPost}
                  className="px-4 py-2 text-xs font-semibold text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] border border-[var(--color-border)] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkAsPosted}
                  disabled={isSubmittingPost}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-[var(--color-fg-inverse)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmittingPost ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
