import "server-only";

export class SmsNotConfiguredError extends Error {
  constructor() {
    super("SMS provider is not configured");
    this.name = "SmsNotConfiguredError";
  }
}

export class SmsDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsDeliveryError";
  }
}

export interface OtpSmsParams {
  phoneE164: string;
  code: string;
  templateId: string;
}

/**
 * Generic HTTP SMS provider. The operator configures:
 * SMS_PROVIDER_URL, SMS_API_KEY, SMS_TEMPLATE_ID.
 * Without configuration the sender throws SmsNotConfiguredError (fail-closed);
 * no code is ever fabricated, logged, or returned to the client.
 */
export async function sendOtpSms(params: OtpSmsParams): Promise<void> {
  const url = process.env["SMS_PROVIDER_URL"];
  const apiKey = process.env["SMS_API_KEY"];
  if (!url || !apiKey) throw new SmsNotConfiguredError();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to: params.phoneE164, templateId: params.templateId, parameters: { code: params.code } }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new SmsDeliveryError("SMS provider request failed");
  }
  if (!res.ok) throw new SmsDeliveryError(`SMS provider rejected the request (${res.status})`);
}
