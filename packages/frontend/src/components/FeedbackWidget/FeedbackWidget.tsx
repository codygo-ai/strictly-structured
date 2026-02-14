"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FEEDBACK_TYPES,
  FEEDBACK_TYPE_CONFIG,
  type FeedbackType,
  type FeedbackPayload,
} from "./types";

const GITHUB_ISSUES_URL =
  "https://github.com/codygo-ai/structured-schema-validator/issues";
const API_URL = "/api/feedback";

type FormState = "idle" | "submitting" | "success" | "error";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Listen for custom event from BetaBanner
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("ssv:open-feedback", handleOpen);
    return () => window.removeEventListener("ssv:open-feedback", handleOpen);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const resetForm = useCallback(() => {
    setType("general");
    setDescription("");
    setEmail("");
    setHoneypot("");
    setFormState("idle");
    setErrorMessage("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) return;
    setFormState("submitting");

    const payload: FeedbackPayload = {
      type,
      description: description.trim(),
      email: email.trim() || undefined,
      website: honeypot || undefined,
      page: window.location.pathname,
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setFormState("success");
    } catch (err) {
      setFormState("error");
      setErrorMessage((err as Error).message);
    }
  }, [type, description, email, honeypot]);

  function handleClose() {
    setOpen(false);
    setTimeout(resetForm, 200);
  }

  const githubNewIssueUrl = `${GITHUB_ISSUES_URL}/new${
    type === "bug"
      ? "?template=bug_report.md"
      : type === "feature"
        ? "?template=feature_request.md"
        : ""
  }`;

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-50">
      {/* Floating trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-all duration-[var(--ds-duration)] hover:scale-105 hover:bg-accent-hover cursor-pointer"
          aria-label="Send feedback"
          title="Send feedback"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Feedback panel */}
      {open && (
        <div className="w-80 rounded-lg border border-border bg-surface shadow-xl feedback-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-primary">
              Send Feedback
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-muted hover:text-primary cursor-pointer"
              aria-label="Close"
            >
              &#x2715;
            </button>
          </div>

          {formState === "success" ? (
            <div className="px-4 py-6 text-center">
              <div className="text-3xl mb-2">&#x2705;</div>
              <p className="text-sm font-medium text-primary">
                Thank you for your feedback!
              </p>
              <p className="text-xs text-secondary mt-1">
                We&apos;ll review it shortly.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 text-sm text-accent hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {/* Type selector */}
              <div className="flex gap-1.5">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      type === t
                        ? "border-accent bg-accent-bg text-accent"
                        : "border-border bg-surface text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {FEEDBACK_TYPE_CONFIG[t].icon}{" "}
                    {FEEDBACK_TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none resize-none"
              />

              {/* Email (optional) */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, for follow-up)"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />

              {/* Honeypot */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] opacity-0"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {formState === "error" && (
                <p className="text-xs text-error">{errorMessage}</p>
              )}

              {/* Submit + GitHub link */}
              <div className="flex items-center justify-between pt-1">
                <a
                  href={githubNewIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted hover:text-accent hover:underline"
                >
                  Or open a GitHub issue
                </a>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !description.trim() || formState === "submitting"
                  }
                  className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:bg-disabled disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {formState === "submitting" ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
