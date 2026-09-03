import "server-only";

import { connect as connectTls, type TLSSocket } from "node:tls";
import { connect as connectTcp, type Socket } from "node:net";

type RedisSocket = Socket | TLSSocket;

function encodeCommand(parts: readonly string[]): string {
  return `*${parts.length}\r\n${parts.map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join("")}`;
}

/**
 * Small RESP client for the two Redis operations required by OTP abuse controls.
 * It intentionally has no in-memory fallback: callers receive a dependency
 * failure when Redis cannot be reached or returns an error.
 */
export class RedisCommandClient {
  public constructor(
    private readonly url: string,
    private readonly timeoutMs = 2_000
  ) {}

  public async eval(
    script: string,
    keys: readonly string[],
    args: readonly string[]
  ): Promise<number> {
    const reply = await this.command(["EVAL", script, String(keys.length), ...keys, ...args]);
    if (!/^-?\d+$/.test(reply)) throw new Error("Redis returned a non-integer response.");
    return Number(reply);
  }

  private async command(parts: readonly string[]): Promise<string> {
    const parsed = new URL(this.url);
    const port = Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379));
    const socket =
      parsed.protocol === "rediss:"
        ? connectTls({ host: parsed.hostname, port, servername: parsed.hostname })
        : connectTcp({ host: parsed.hostname, port });

    return new Promise<string>((resolve, reject) => {
      let response = "";
      let timeout: NodeJS.Timeout | undefined;
      const finish = (error?: Error, value?: string) => {
        if (timeout) clearTimeout(timeout);
        socket.removeAllListeners();
        socket.destroy();
        if (error) reject(error);
        else resolve(value ?? "");
      };

      socket.once("error", (error) => finish(error));
      socket.on("data", (chunk: Buffer) => {
        response += chunk.toString("utf8");
        const end = response.indexOf("\r\n");
        if (end < 0) return;
        if (response.startsWith("-")) return finish(new Error("Redis command failed."));
        if (response.startsWith(":")) return finish(undefined, response.slice(1, end));
        finish(new Error("Redis returned an unsupported response."));
      });
      timeout = setTimeout(() => finish(new Error("Redis command timed out.")), this.timeoutMs);
      socket.once(parsed.protocol === "rediss:" ? "secureConnect" : "connect", () =>
        socket.write(encodeCommand(parts))
      );
    });
  }
}
