export const errorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "DOMAIN_ERROR",
  "DEPENDENCY_FAILURE",
  "INTERNAL_ERROR"
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly expose: boolean;

  public constructor({
    code,
    message,
    httpStatus,
    expose = true
  }: {
    code: ErrorCode;
    message: string;
    httpStatus: number;
    expose?: boolean;
  }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.expose = expose;
  }
}
