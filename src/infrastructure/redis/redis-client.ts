import "server-only";

import { connect as connectTls, type TLSSocket } from "node:tls";
import { connect as connectTcp, type Socket } from "node:net";

type RedisSocket = Socket | TLSSocket;

type RedisEndpoint = Readonly<{
  secure: boolean;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  database: number;
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
      let queuedCommands: readonly (readonly string[])[] = [];
      const finish = (error?: Error, value?: string) => {
        if (timeout) clearTimeout(timeout);
        socket.removeAllListeners();
        socket.destroy();
        if (error) reject(error);
        else resolve(value ?? "");
      };

      const sendNextCommand = () => {
        const command = queuedCommands[0];
        if (!command) return finish(undefined, "");
        queuedCommands = queuedCommands.slice(1);
        socket.write(encodeCommand(command));
      };

      socket.once("error", (error) => finish(error));
      socket.on("data", (chunk: Buffer) => {
        response += chunk.toString("utf8");
        while (true) {
          const end = response.indexOf("\r\n");
          if (end < 0) return;
          const reply = response.slice(0, end);
          response = response.slice(end + 2);
          if (reply.startsWith("-")) return finish(new Error("Redis command failed."));
          if (queuedCommands.length > 0) {
            if (!reply.startsWith("+OK")) return finish(new Error("Redis authentication failed."));
            sendNextCommand();
            continue;
          }
          if (reply.startsWith(":")) return finish(undefined, reply.slice(1));
          return finish(new Error("Redis returned an unsupported response."));
        }
      });
      timeout = setTimeout(() => finish(new Error("Redis command timed out.")), this.timeoutMs);
      socket.once(endpoint.secure ? "secureConnect" : "connect", () => {
        const setupCommands: (readonly string[])[] = [];
        if (endpoint.password !== null) {
          setupCommands.push(
            endpoint.username === null
              ? ["AUTH", endpoint.password]
              : ["AUTH", endpoint.username, endpoint.password]
          );
        }
        if (endpoint.database !== 0) setupCommands.push(["SELECT", String(endpoint.database)]);
        queuedCommands = [...setupCommands, parts];
        sendNextCommand();
      });
    });
  }

  /**
   * Redis credentials and a database index are applied before EVAL. This is
   * deliberately explicit: accepting either URL field without issuing AUTH or
   * SELECT would silently use the wrong security or data boundary.
   */
  private parseEndpoint(): RedisEndpoint {
    const parsed = new URL(this.url);
    if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
      throw new Error("Redis URL must use redis:// or rediss://.");
    }
    if (!parsed.hostname) throw new Error("Redis URL must include a host.");

    const port = Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379));
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new Error("Redis URL must include a valid port.");
    }
    const databasePath =
      !parsed.pathname || parsed.pathname === "/" ? "0" : parsed.pathname.slice(1);
    if (!/^\d+$/.test(databasePath)) {
      throw new Error("Redis URL must include a numeric database path.");
    }
    const database = Number(databasePath);
    if (!Number.isSafeInteger(database) || database < 0) {
      throw new Error("Redis URL must include a valid database path.");
    }
    if (parsed.search || parsed.hash)
      throw new Error("Redis URL must not include query or fragment data.");

    const username = parsed.username ? decodeURIComponent(parsed.username) : null;
    const password = parsed.password ? decodeURIComponent(parsed.password) : null;
    if (username !== null && password === null) {
      throw new Error("Redis URL username requires a password.");
    }
    return {
      secure: parsed.protocol === "rediss:",
      host: parsed.hostname,
      port,
      username,
      password,
      database
    };
  }
}
