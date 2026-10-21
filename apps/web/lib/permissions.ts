/**
 * Client-side route/UI gating. This only decides what to SHOW; the API enforces
 * authorization on every route (AGENTS.md: require_role + ownership scoping).
 */
export type UserRole = "entrepreneur" | "mentor" | "super_admin";

export type PermissionArea =
  | "admin"
  | "business"
  | "plan"
  | "content"
  | "metrics"
  | "mentors"
  | "mentor_panel"
  | "notifications";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve";

const ENTREPRENEUR_AREAS: ReadonlySet<string> = new Set(["business", "plan", "content", "metrics", "mentors", "notifications"]);
const MENTOR_AREAS: ReadonlySet<string> = new Set(["mentor_panel", "notifications"]);

/** `resource` and `action` are accepted (and ignored) so call sites stay stable if rules get finer later. */
export function can(
  role: UserRole,
  area: PermissionArea | string,
  ..._detail: [resource?: string, action?: PermissionAction | string]
): boolean {
  if (role === "super_admin") return true;
  if (role === "entrepreneur") return ENTREPRENEUR_AREAS.has(area);
  if (role === "mentor") return MENTOR_AREAS.has(area);
  return false;
}
