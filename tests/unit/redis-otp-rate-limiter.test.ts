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
});
