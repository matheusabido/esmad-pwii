export const AVAILABLE_ROLES = ["admin", "student", "employee"] as const;
export type Role = (typeof AVAILABLE_ROLES)[number];
