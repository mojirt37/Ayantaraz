import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import type { Socket } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { RedisCommandClient } from "../../src/infrastructure/redis/redis-client";
import { RedisOtpRequestRateLimiter } from "../../src/infrastructure/redis/redis-otp-rate-limiter";

const servers: ReturnType<typeof createServer>[] = [];
const sockets = new Set<Socket>();
const keySecret = randomBytes(32).toString("hex");

afterEach(async () => {
  for (const socket of sockets) socket.destroy();
  sockets.clear();
  await Promise.all(
    servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve())))
  );
});

describe("Redis OTP rate limiter adapter", () => {
  it("uses Redis EVAL with opaque phone/IP keys and maps its atomic result", async () => {
    let request = "";
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
      socket.on("data", (data) => {
        request += data.toString("utf8");
        socket.end(":1\r\n");
      });
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not expose a TCP port.");

    const limiter = new RedisOtpRequestRateLimiter(
      new RedisCommandClient(`redis://127.0.0.1:${address.port}`),
      keySecret,
      { windowSeconds: 60, phoneLimit: 3, ipLimit: 8 }
    );

    await expect(
      limiter.acquire({ phoneE164: "+989121234567", clientIp: "192.0.2.1", now: new Date(0) })
    ).resolves.toBe(true);
    expect(request).toContain("EVAL");
    expect(request).not.toContain("+989121234567");
    expect(request).not.toContain("192.0.2.1");
  });

  it("fails rather than permitting requests when Redis returns an error", async () => {
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
      socket.once("data", () => socket.end("-ERR unavailable\r\n"));
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not expose a TCP port.");

    const limiter = new RedisOtpRequestRateLimiter(
      new RedisCommandClient(`redis://127.0.0.1:${address.port}`),
      keySecret,
      { windowSeconds: 60, phoneLimit: 3, ipLimit: 8 }
    );
    await expect(
      limiter.acquire({ phoneE164: "+989121234567", clientIp: "192.0.2.1", now: new Date() })
    ).rejects.toThrow("Redis command failed.");
  });

  it("times out rather than allowing an OTP request when Redis does not respond", async () => {
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not expose a TCP port.");

    const limiter = new RedisOtpRequestRateLimiter(
      new RedisCommandClient(`redis://127.0.0.1:${address.port}`, 20),
      keySecret,
      { windowSeconds: 60, phoneLimit: 3, ipLimit: 8 }
    );
    await expect(
      limiter.acquire({ phoneE164: "+989121234567", clientIp: "192.0.2.1", now: new Date() })
    ).rejects.toThrow("Redis command timed out.");
  });

  it("authenticates and selects the configured database before evaluating the rate-limit script", async () => {
    const requests: string[] = [];
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
      socket.on("data", (data) => {
        requests.push(data.toString("utf8"));
        socket.write(requests.length < 3 ? "+OK\r\n" : ":1\r\n");
      });
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not expose a TCP port.");

    const client = new RedisCommandClient(
      `redis://rate-user:rate%2Dsecret@127.0.0.1:${address.port}/3`
    );
    await expect(client.eval("return 1", [], [])).resolves.toBe(1);
    expect(requests).toEqual([
      expect.stringContaining("AUTH"),
      expect.stringContaining("SELECT"),
      expect.stringContaining("EVAL")
    ]);
    expect(requests[0]).toContain("rate-user");
    expect(requests[0]).toContain("rate-secret");
    expect(requests[1]).toContain("\r\n3\r\n");
  });

  it("rejects malformed Redis URLs instead of making an unsafe request", async () => {
    const invalidScheme = new RedisCommandClient("http://127.0.0.1:6379");
    await expect(invalidScheme.eval("return 1", [], [])).rejects.toThrow(
      "Redis URL must use redis:// or rediss://."
    );

    const usernameWithoutPassword = new RedisCommandClient("redis://rate-user@127.0.0.1:6379");
    await expect(usernameWithoutPassword.eval("return 1", [], [])).rejects.toThrow(
      "Redis URL username requires a password."
    );

    const nonNumericDatabase = new RedisCommandClient("redis://127.0.0.1:6379/otp");
    await expect(nonNumericDatabase.eval("return 1", [], [])).rejects.toThrow(
      "Redis URL must include a numeric database path."
    );

    const query = new RedisCommandClient("redis://127.0.0.1:6379/0?role=otp");
    await expect(query.eval("return 1", [], [])).rejects.toThrow(
      "Redis URL must not include query or fragment data."
    );
  });
});
