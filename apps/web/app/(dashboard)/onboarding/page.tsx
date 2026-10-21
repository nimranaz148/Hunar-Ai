"use client";

import { MascotAvatar } from "@/components/landing/MascotAvatar";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingService, OnboardingMessageItem } from "@/lib/api";


const QUICK_PROMPTS = [
  "Mujhe ghar se home bakery start karni hai Gulshan Karachi mein, budget 25,000 PKR",
  "Handmade jewellery aur resin art ka business, Lahore, budget 15,000 PKR",
  "Ladies boutique aur customized stitching, Islamabad, budget 50,000 PKR",
  "Online tutoring academy shuru karni hai, budget 10,000 PKR",
];

const INITIAL_GREETING: OnboardingMessageItem = {
  id: "greeting-default",
  role: OnboardingMessageItem.role.ASSISTANT,
  content:
    "Assalamu alaikum! Main Hunar hun. Apni business idea batayein — kya banana/bechna chahti hain, kahan se, aur budget kitna hai?",
  meta: {},
  created_at: "2026-10-01T00:00:00.000Z",
};

let tempCounter = 0;
function createTempMessage(role: "user" | "assistant", content: string): OnboardingMessageItem {
  tempCounter += 1;
  const itemRole =
    role === "user"
      ? OnboardingMessageItem.role.USER
      : OnboardingMessageItem.role.ASSISTANT;
  return {
    id: `temp-${role}-${tempCounter}`,
    role: itemRole,
    content,
    meta: {},
    created_at: "",
  };
}



export default function OnboardingChatPage() {
  const [messages, setMessages] = useState<OnboardingMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch conversation history on mount
  useEffect(() => {
    OnboardingService.getMessagesApiV1OnboardingMessagesGet()
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([INITIAL_GREETING]);
        }
        setIsProfileComplete(Boolean(data.is_profile_complete));
        setBusinessId(data.business_id || null);
        setIsLoadingHistory(false);
      })
      .catch((err) => {
        // Fallback to initial greeting on error
        setMessages([INITIAL_GREETING]);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load chat history"
        );
        setIsLoadingHistory(false);
      });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, statusMessage]);

  // 2. Handle Send message with SSE streaming
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    setInputValue("");
    setErrorMessage(null);

    // Optimistically add user's message
    const tempUserMsg = createTempMessage("user", text);

    // Prepare assistant placeholder for streaming tokens
    const tempAsstMsg = createTempMessage("assistant", "");

    setMessages((prev) => [...prev, tempUserMsg, tempAsstMsg]);

    setIsStreaming(true);
    setStatusMessage("Agent is thinking...");

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : "http://localhost:8000");

    try {
      const response = await fetch(`${apiUrl}/api/v1/onboarding/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Chat error (${response.status}): ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Streaming response not supported by server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.replace(/^data:\s*/, "");
            try {
              const data = JSON.parse(jsonStr);

              if (data.event === "status") {
                setStatusMessage(data.text || "Agent is thinking...");
              } else if (data.event === "chunk") {
                setStatusMessage(null);
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: updated[lastIdx].content + data.text,
                    };
                  }
                  return updated;
                });
              } else if (data.event === "profile_complete") {
                setIsProfileComplete(true);
                if (data.business_id) {
                  setBusinessId(data.business_id);
                }
              } else if (data.event === "done") {
                setStatusMessage(null);
                if (data.business_id) {
                  setBusinessId(data.business_id);
                }
                if (data.is_complete) {
                  setIsProfileComplete(true);
                }
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to connect to agent"
      );
      // Remove placeholder empty assistant bubble on immediate error
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      userName="Entrepreneur"
      pageTitle="AI Business Onboarding"
    >
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto space-y-4">
        {/* Header Wireframe §30.1 */}
        <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <div className="flex items-center gap-3">
            <MascotAvatar size={44} />
            <div>
              <h2 className="text-base font-bold text-[var(--color-fg)] flex items-center gap-2">
                Hunar — Tell us about your business idea
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] border border-[var(--color-border)]">
                  Intake Agent (F-003)
                </span>
              </h2>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Roman Urdu ya English mein freely baat karein. Hum aapka business profile extract karenge.
              </p>
            </div>
          </div>

          {isProfileComplete && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Profile Created
              </span>
              <Link
                href="/business"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                View Profile
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Profile Complete Banner */}
        {isProfileComplete && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-status-success-bg)] border border-[var(--color-status-success-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-status-success-fg)] shrink-0" />
              <div>
                <p className="text-sm font-bold text-[var(--color-status-success-fg)] flex items-center gap-2">
                  Zabardast! Aapki business profile successfully register ho chuki hai.
                  {businessId && (
                    <span className="text-2xs font-mono font-normal px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                      ID: {businessId.slice(0, 8)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Next step: Validation Report aur Pricing & Break-even analysis check karein.
                </p>

              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/business"
                className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-fg)] hover:bg-[var(--color-surface-sunken)] transition-colors"
              >
                Business Profile (F-004)
              </Link>
              <Link
                href="/plan"
                className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Launch Plan (F-008)
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)] flex items-center gap-2 text-xs text-[var(--color-status-error-fg)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full text-[var(--color-fg-muted)] gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
              Loading conversation history...
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-start gap-3 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <MascotAvatar size={34} />
                  )}

                  <div
                    className={`max-w-[75%] rounded-[var(--radius-lg)] p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? "bg-[var(--color-surface-sunken)] text-[var(--color-fg)] border border-[var(--color-border)]"
                        : "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] font-medium shadow-xs"
                    }`}
                  >
                    {msg.content || (
                      <span className="italic text-[var(--color-fg-muted)]">
                        Thinking...
                      </span>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking status indicator wireframe §30.1 */}
          {statusMessage && (
            <div className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] text-xs w-fit border border-[var(--color-border)] animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>⏳ {statusMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        {messages.length <= 2 && !isStreaming && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--color-fg-muted)]">
              Suggested ideas to start with:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-accent)] transition-colors"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Box Wireframe §30.1 */}
        <div className="flex items-end gap-2 p-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Type your message in Roman Urdu or English... (Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none bg-transparent text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isStreaming}
            className="inline-flex items-center justify-center p-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
