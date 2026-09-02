import { failure, success, type Result } from "../../../shared/errors/result";

export type Actor = Readonly<{ userId: string; role: "USER" | "ADMIN" }>;

export function requireAdmin(actor: Actor | null): Result<Actor> {
  if (actor === null) {
    return failure("UNAUTHENTICATED", "Authentication is required.", 401);
  }
  if (actor.role !== "ADMIN") {
    return failure("FORBIDDEN", "Administrator access is required.", 403);
  }
  return success(actor);
}

export function requireOwnership(actor: Actor | null, ownerUserId: string): Result<Actor> {
  if (actor === null) {
    return failure("UNAUTHENTICATED", "Authentication is required.", 401);
  }
  if (actor.role !== "ADMIN" && actor.userId !== ownerUserId) {
    return failure("FORBIDDEN", "You do not have access to this resource.", 403);
  }
  return success(actor);
}
