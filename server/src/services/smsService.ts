export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  name: string;
  sendSms(to: string, message: string): Promise<SmsSendResult>;
}

export class DevelopmentSmsProvider implements SmsProvider {
  name = "development";

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    // In dev / demo mode: safely log without sending real external network requests
    console.log(`[SMS-DEV] Message sent to ${to}: "${message}"`);
    return {
      success: true,
      messageId: `dev-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }
}

export class TwilioSmsProvider implements SmsProvider {
  name = "twilio";
  private accountSid?: string;
  private authToken?: string;
  private fromNumber?: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn("[SMS-Twilio] Twilio credentials missing. Falling back to development delivery log.");
      return new DevelopmentSmsProvider().sendSms(to, message);
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: message,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Twilio error: ${errorText}` };
      }

      const data = (await response.json()) as { sid?: string };
      return { success: true, messageId: data.sid };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown SMS error" };
    }
  }
}

export function getSmsProvider(): SmsProvider {
  const providerType = (process.env.SMS_PROVIDER || "development").toLowerCase();
  if (providerType === "twilio") {
    return new TwilioSmsProvider();
  }
  return new DevelopmentSmsProvider();
}
