export const FEEDBACK_TYPES = ["bug", "feature", "general"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_CONFIG: Record<
  FeedbackType,
  { label: string; icon: string; ghLabel: string }
> = {
  bug: { label: "Bug Report", icon: "\u{1F41B}", ghLabel: "bug" },
  feature: { label: "Feature Request", icon: "\u{1F4A1}", ghLabel: "enhancement" },
  general: { label: "General Feedback", icon: "\u{1F4AC}", ghLabel: "feedback" },
};

export interface FeedbackPayload {
  type: FeedbackType;
  description: string;
  email?: string;
  website?: string;
  page: string;
}
