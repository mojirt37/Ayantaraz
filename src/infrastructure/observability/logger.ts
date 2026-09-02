import "server-only";

export type LogLevel = "info" | "warn" | "error";
export type LogEvent = {
  event: string;
  level?: LogLevel;
  requestId?: string;
  route?: string;
  status?: number;
  latencyMs?: number;
  errorCode?: string;
};

export function log(event: LogEvent): void {
  const { level = "info", ...payload } = event;
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, ...payload });

  if (level === "error") {
    console.error(entry);
    return;
  }
  if (level === "warn") {
    console.warn(entry);
    return;
  }
  console.info(entry);
}
