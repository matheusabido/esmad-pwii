export const AVAILABLE_PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof AVAILABLE_PRIORITIES)[number];
