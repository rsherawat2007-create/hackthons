export type SubscriptionTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface PlanDetails {
  id: string;
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  engagementLimit: number; // -1 for unlimited
  features: string[];
  isPopular?: boolean;
}

export interface BrandUsageStatus {
  tier: SubscriptionTier;
  planName: string;
  engagementsUsed: number;
  engagementsLimit: number;
  engagementsRemaining: number;
  displayStatus: "3 free engagements available" | "2 remaining" | "1 remaining" | "0 remaining" | string;
  isLimitReached: boolean;
  canEngage: boolean;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
  status: "pending" | "completed";
}

/**
 * Payment Provider Abstraction (IPaymentProvider)
 * Allows plugging in Stripe, Lemon Squeezy, Paddle, or custom merchant processors
 * without modifying the core marketplace codebase.
 */
export interface IPaymentProvider {
  readonly name: string;

  createCheckoutSession(params: {
    userId: string;
    brandId: string;
    targetTier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionResult>;

  verifySubscription(userId: string): Promise<{
    active: boolean;
    tier: SubscriptionTier;
    expiresAt?: Date | null;
  }>;

  handleWebhook?(
    rawPayload: string | Buffer,
    signature: string
  ): Promise<{ handled: boolean; event: string }>;
}
