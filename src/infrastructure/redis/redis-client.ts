import "server-only";

import { connect as connectTls, type TLSSocket } from "node:tls";
import { connect as connectTcp, type Socket } from "node:net";

type RedisSocket = Socket | TLSSocket;

type RedisEndpoint = Readonly<{
  secure: boolean;
  host: string;
  port: number;
}>;

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
    const endpoint = this.parseEndpoint();
    const socket = endpoint.secure
      ? connectTls({ host: endpoint.host, port: endpoint.port, servername: endpoint.host })
      : connectTcp({ host: endpoint.host, port: endpoint.port });

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
      socket.once(endpoint.secure ? "secureConnect" : "connect", () =>
        socket.write(encodeCommand(parts))
      );
    });
  }

  /**
   * This deliberately refuses credentials instead of silently dropping them.
   * The current minimal client only supports the EVAL command; accepting a
   * credential-bearing URL without issuing AUTH would create an unsafe and
   * misleading production configuration path.
   */
  private parseEndpoint(): RedisEndpoint {
    const parsed = new URL(this.url);
    if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
      throw new Error("Redis URL must use redis:// or rediss://.");
    }
    if (!parsed.hostname) throw new Error("Redis URL must include a host.");
    if (parsed.username || parsed.password) {
      throw new Error("Redis URL credentials are not supported by this client.");
    }

    const port = Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379));
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new Error("Redis URL must include a valid port.");
    }
    return { secure: parsed.protocol === "rediss:", host: parsed.hostname, port };
  }
}
