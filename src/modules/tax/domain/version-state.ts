import { failure, success, type Result } from "../../../shared/errors/result";

export const versionStatuses = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"] as const;
export type VersionStatus = (typeof versionStatuses)[number];

const allowedTransitions: Readonly<Record<VersionStatus, readonly VersionStatus[]>> = {
  DRAFT: ["REVIEW"],
  REVIEW: ["APPROVED"],
  APPROVED: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: []
};

export function transitionVersion(
  current: VersionStatus,
  next: VersionStatus
): Result<VersionStatus> {
  if (allowedTransitions[current].includes(next)) {
    return success(next);
  }

  return failure("DOMAIN_ERROR", "Invalid version state transition.", 422);
}
