export const STAGES = [
  { key: "inquiry", label: "Inquiry" },
  { key: "design", label: "Design" },
  { key: "fabric", label: "Fabric sourced" },
  { key: "pattern", label: "Pattern / toile" },
  { key: "fitting1", label: "Fitting 1" },
  { key: "fitting2", label: "Fitting 2" },
  { key: "finishing", label: "Finishing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];
export const stageKeys = STAGES.map((s) => s.key) as [StageKey, ...StageKey[]];
export const stageLabel = (k: string) => STAGES.find((s) => s.key === k)?.label ?? k;

export const ORDER_KINDS = [
  { key: "bridal", label: "Bridal" },
  { key: "evening", label: "Evening" },
] as const;

export const ATTACHMENT_CATEGORIES = [
  { key: "sketch", label: "Design sketch" },
  { key: "inspiration", label: "Client inspiration" },
  { key: "fabric", label: "Fabric / swatch" },
  { key: "pattern", label: "Pattern / toile" },
  { key: "fitting", label: "Fitting photo" },
  { key: "wip", label: "Work in progress" },
  { key: "final", label: "Final gown" },
  { key: "other", label: "Other" },
] as const;
export const categoryLabel = (k: string) =>
  ATTACHMENT_CATEGORIES.find((c) => c.key === k)?.label ?? k;

export const APPOINTMENT_TYPES = [
  { key: "consultation", label: "Consultation" },
  { key: "measurements", label: "Measurements" },
  { key: "fitting1", label: "Fitting 1" },
  { key: "fitting2", label: "Fitting 2" },
  { key: "fitting3", label: "Fitting 3" },
  { key: "final_fitting", label: "Final fitting" },
  { key: "delivery", label: "Delivery" },
] as const;
export const apptLabel = (k: string) =>
  APPOINTMENT_TYPES.find((c) => c.key === k)?.label ?? k;

export const PAYMENT_METHODS = [
  { key: "cash", label: "Cash" },
  { key: "instapay", label: "InstaPay" },
  { key: "bank", label: "Bank transfer" },
  { key: "other", label: "Other" },
] as const;

export const COST_CATEGORIES = [
  { key: "labor", label: "Labor" },
  { key: "outsourced", label: "Outsourced (embroidery, beading)" },
  { key: "other", label: "Other" },
] as const;

export const MEASUREMENT_FIELDS = [
  "bust", "underbust", "waist", "hip", "shoulder", "back length", "front length",
  "arm length", "bicep", "height", "skirt length", "train length",
] as const;

export const PAYMENT_STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "bg-sand text-oxblood" },
  deposit_paid: { label: "Deposit paid", cls: "bg-olive/20 text-oxblood" },
  partial: { label: "Partially paid", cls: "bg-copper/25 text-oxblood" },
  paid: { label: "Paid in full", cls: "bg-olive text-cream" },
  overdue: { label: "Overdue", cls: "bg-burnt text-cream" },
};
