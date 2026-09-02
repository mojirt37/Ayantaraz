import { AppError, type ErrorCode } from "./app-error";

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure(code: ErrorCode, message: string, httpStatus: number): Result<never> {
  return { ok: false, error: new AppError({ code, message, httpStatus }) };
}
