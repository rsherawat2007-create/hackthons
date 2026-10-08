export interface PhoneValidationResult {
  isDisposable: boolean;
  isSuspicious: boolean;
  isValid: boolean;
  carrier?: string;
  lineType?: "mobile" | "landline" | "voip" | "prepaid" | "virtual" | "unknown";
  riskScore?: number; // 0 (safe) to 100 (high risk)
  reason?: string;
  provider: string;
  isDevelopmentMode: boolean;
}

export interface DisposablePhoneDetector {
  name: string;
  checkPhone(phone: string): Promise<PhoneValidationResult>;
}

/**
 * Development & Demo Detector
 * Runs when no third-party API credentials are configured.
 * Clearly flags response as development mode.
 * Recognizes common test pattern suites for deterministic developer testing while keeping all real users clean.
 */
export class DevelopmentPhoneDetector implements DisposablePhoneDetector {
  name = "development";

  async checkPhone(phone: string): Promise<PhoneValidationResult> {
    const clean = phone.replace(/[\s\-()]/g, "");

    // Test hooks for developers and manual testing without breaking legitimate numbers:
    // Any test phone containing "000000" or ending in "9999" can simulate a disposable/virtual burner number
    const isTestDisposable = clean.includes("000000") || clean.endsWith("9999");
    const isTestSuspicious = clean.endsWith("8888");

    if (isTestDisposable) {
      return {
        isDisposable: true,
        isSuspicious: true,
        isValid: true,
        lineType: "virtual",
        riskScore: 95,
        reason: "Simulated disposable/temporary VoIP number in development mode (ends with 9999 or contains 000000)",
        provider: this.name,
        isDevelopmentMode: true,
      };
    }

    if (isTestSuspicious) {
      return {
        isDisposable: false,
        isSuspicious: true,
        isValid: true,
        lineType: "voip",
        riskScore: 75,
        reason: "Simulated high-risk VoIP number in development mode (ends with 8888)",
        provider: this.name,
        isDevelopmentMode: true,
      };
    }

    return {
      isDisposable: false,
      isSuspicious: false,
      isValid: true,
      lineType: "mobile",
      riskScore: 5,
      provider: this.name,
      isDevelopmentMode: true,
    };
  }
}

/**
 * Twilio Lookup v2 Detector
 * Uses Twilio's Carrier and Line Type Intelligence API to detect VoIP, virtual, and prepaid burner lines.
 */
export class TwilioLookupDetector implements DisposablePhoneDetector {
  name = "twilio-lookup";
  private accountSid?: string;
  private authToken?: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
  }

  async checkPhone(phone: string): Promise<PhoneValidationResult> {
    if (!this.accountSid || !this.authToken) {
      console.warn("[PhoneDetector-Twilio] Missing Twilio credentials. Falling back to development detector.");
      return new DevelopmentPhoneDetector().checkPhone(phone);
    }

    try {
      // Twilio Lookup v2 API endpoint with line_type_intelligence and identity_match
      const encodedPhone = encodeURIComponent(phone);
      const endpoint = `https://lookups.twilio.com/v2/PhoneNumbers/${encodedPhone}?Fields=line_type_intelligence`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
        },
      });

      if (!response.ok) {
        console.error(`[PhoneDetector-Twilio] Lookup failed with status ${response.status}`);
        // If external API fails, fail open or fallback to dev detector rather than blocking user
        return {
          isDisposable: false,
          isSuspicious: false,
          isValid: true,
          provider: this.name,
          isDevelopmentMode: false,
          reason: "External lookup verification skipped due to upstream provider status",
        };
      }

      const data = (await response.json()) as {
        valid?: boolean;
        line_type_intelligence?: {
          type?: string;
          carrier_name?: string;
          mobile_network_code?: string;
        };
      };

      const lineType = (data.line_type_intelligence?.type || "unknown").toLowerCase();
      const carrier = data.line_type_intelligence?.carrier_name;

      // Non-fixed VoIP, virtual, and certain temporary types are flagged as disposable
      const isDisposable = ["non_fixed_voip", "virtual", "temporary"].includes(lineType);
      const isSuspicious = isDisposable || ["fixed_voip", "tollfree", "pager"].includes(lineType);

      return {
        isDisposable,
        isSuspicious,
        isValid: data.valid !== false,
        carrier,
        lineType: (isDisposable ? "virtual" : lineType.includes("voip") ? "voip" : "mobile") as PhoneValidationResult["lineType"],
        riskScore: isDisposable ? 90 : isSuspicious ? 60 : 10,
        reason: isDisposable ? "Temporary or non-fixed VoIP line detected" : undefined,
        provider: this.name,
        isDevelopmentMode: false,
      };
    } catch (err) {
      console.error("[PhoneDetector-Twilio] Error inspecting phone:", err);
      return new DevelopmentPhoneDetector().checkPhone(phone);
    }
  }
}

/**
 * Abstract Generic HTTP Disposable Detector (e.g., Numverify, AbstractAPI, Veriphone, IPQS)
 * Configurable via PHONE_VALIDATION_URL and PHONE_VALIDATION_API_KEY
 */
export class GenericApiPhoneDetector implements DisposablePhoneDetector {
  name = "generic-api";
  private apiUrl?: string;
  private apiKey?: string;

  constructor() {
    this.apiUrl = process.env.PHONE_VALIDATION_URL;
    this.apiKey = process.env.PHONE_VALIDATION_API_KEY;
  }

  async checkPhone(phone: string): Promise<PhoneValidationResult> {
    if (!this.apiUrl || !this.apiKey) {
      console.warn("[PhoneDetector-Generic] Missing validation URL/Key. Falling back to development detector.");
      return new DevelopmentPhoneDetector().checkPhone(phone);
    }

    try {
      const url = new URL(this.apiUrl);
      url.searchParams.set("api_key", this.apiKey);
      url.searchParams.set("phone", phone);

      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) {
        return new DevelopmentPhoneDetector().checkPhone(phone);
      }

      const json = (await res.json()) as {
        valid?: boolean;
        is_disposable?: boolean;
        disposable?: boolean;
        is_voip?: boolean;
        line_type?: string;
        risk_score?: number;
        carrier?: string;
      };

      const isDisposable = Boolean(json.is_disposable ?? json.disposable);
      const isSuspicious = isDisposable || Boolean(json.is_voip) || (json.risk_score ? json.risk_score > 70 : false);

      return {
        isDisposable,
        isSuspicious,
        isValid: json.valid !== false,
        carrier: json.carrier,
        riskScore: json.risk_score ?? (isDisposable ? 90 : 10),
        reason: isDisposable ? "Disposable or temporary carrier detected by validation service" : undefined,
        provider: this.name,
        isDevelopmentMode: false,
      };
    } catch (err) {
      console.error("[PhoneDetector-Generic] Lookup failed:", err);
      return new DevelopmentPhoneDetector().checkPhone(phone);
    }
  }
}

export function getPhoneDetector(): DisposablePhoneDetector {
  const provider = (process.env.PHONE_DETECTOR_PROVIDER || "").toLowerCase();

  if (provider === "twilio" || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && provider !== "development")) {
    return new TwilioLookupDetector();
  }

  if (provider === "generic" || process.env.PHONE_VALIDATION_URL) {
    return new GenericApiPhoneDetector();
  }

  return new DevelopmentPhoneDetector();
}
