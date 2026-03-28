export const AVAILABLE_STATUSES = [
  "pending",
  "rejected",
  "active",
  "inactive",
] as const;
export type Status = (typeof AVAILABLE_STATUSES)[number];
