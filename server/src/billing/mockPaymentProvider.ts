import type { IPaymentProvider, SubscriptionTier, CheckoutSessionResult } from "./types.js";

/**
 * MockPaymentProvider
 * Implements IPaymentProvider abstraction.
 * Ready for future production replacement with Stripe / Paddle / LemonSqueezy.
 */
export class MockPaymentProvider implements IPaymentProvider {
  public readonly name = "mock-checkout-engine";

  async createCheckoutSession(params: {
    userId: string;
    brandId: string;
    targetTier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionResult> {
    const sessionId = `chk_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const checkoutUrl = `${params.successUrl}?session_id=${sessionId}&tier=${params.targetTier}`;

    return {
      sessionId,
      checkoutUrl,
      provider: this.name,
      status: "completed",
    };
  }

  async verifySubscription(userId: string): Promise<{
    active: boolean;
    tier: SubscriptionTier;
    expiresAt?: Date | null;
  }> {
    return {
      active: true,
      tier: "PRO",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}
