"use client";

export function FeedbackLink() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("ssv:open-feedback"))
      }
      className="text-sm text-primary hover:underline cursor-pointer"
    >
      Feedback
    </button>
  );
}
