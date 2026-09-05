import { describe, expect, it, vi, afterEach } from "vitest";
import { SmsNotConfiguredError, sendOtpSms } from "../../src/infrastructure/sms/sms-sender";

describe("sendOtpSms", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fail-closes when provider is not configured", async () => {
    vi.stubEnv("SMS_PROVIDER_URL", "");
    vi.stubEnv("SMS_API_KEY", "");
    await expect(sendOtpSms({ phoneE164: "+989123456789", code: "123456", templateId: "otp" })).rejects.toBeInstanceOf(
      SmsNotConfiguredError
    );
  });

  it("posts code to the configured provider without leaking it elsewhere", async () => {
    vi.stubEnv("SMS_PROVIDER_URL", "https://sms.example/send");
    vi.stubEnv("SMS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await sendOtpSms({ phoneE164: "+989123456789", code: "123456", templateId: "otp" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sms.example/send");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(String(init.body)).toContain("123456");
  });
});
