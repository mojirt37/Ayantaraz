import { failure, success, type Result } from "../../../shared/errors/result";

export const contentStatuses = ["DRAFT", "PREVIEW", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

const allowedTransitions: Readonly<Record<ContentStatus, readonly ContentStatus[]>> = {
  DRAFT: ["PREVIEW"],
  PREVIEW: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: []
};

export function transitionContent(
  current: ContentStatus,
  next: ContentStatus
): Result<ContentStatus> {
  if (allowedTransitions[current].includes(next)) {
    return success(next);
  }

  return failure("DOMAIN_ERROR", "Invalid content state transition.", 422);
}
