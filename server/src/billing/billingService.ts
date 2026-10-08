import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import type {
  BrandUsageStatus,
  IPaymentProvider,
  PlanDetails,
  SubscriptionTier,
} from "./types.js";
import { MockPaymentProvider } from "./mockPaymentProvider.js";

export const PLANS: PlanDetails[] = [
  {
    id: "plan_free",
    tier: "FREE",
    name: "Free Trial",
    tagline: "Explore verified creators and test briefs",
    priceMonthly: 0,
    engagementLimit: 3,
    features: [
      "3 free creator engagements",
      "Unlimited creator discovery & map search",
      "Full creator profile & portfolio viewing",
      "Creator side-by-side comparison",
      "AI-assisted brief builder",
    ],
  },
  {
    id: "plan_starter",
    tier: "STARTER",
    name: "Growth",
    tagline: "For active brand campaigns & growing agencies",
    priceMonthly: 49,
    engagementLimit: 25,
    isPopular: true,
    features: [
      "25 creator engagements per month",
      "Priority response routing",
      "Commercial rights verification trail",
      "Shortlist collaboration with team",
      "Standard support",
    ],
  },
  {
    id: "plan_pro",
    tier: "PRO",
    name: "Scale Pro",
    tagline: "For high-volume creative production",
    priceMonthly: 149,
    engagementLimit: 100,
    features: [
      "100 creator engagements per month",
      "CreatorHub AI priority matching engine",
      "Verified commercial contract templates",
      "Multi-campaign brief generator",
      "Dedicated account manager",
    ],
  },
  {
    id: "plan_enterprise",
    tier: "ENTERPRISE",
    name: "Enterprise",
    tagline: "For enterprise marketing organizations",
    priceMonthly: 399,
    engagementLimit: -1,
    features: [
      "Unlimited creator engagements",
      "Custom security & vendor compliance",
      "Dedicated creative talent scout",
      "Custom billing & invoicing",
      "24/7 SLA & team onboarding",
    ],
  },
];

class BillingService {
  private paymentProvider: IPaymentProvider;
  // Persistent memory store for brand tier upgrades in current runtime
  private brandTierMap = new Map<string, SubscriptionTier>();

  constructor(provider?: IPaymentProvider) {
    this.paymentProvider = provider || new MockPaymentProvider();
  }

  setPaymentProvider(provider: IPaymentProvider) {
    this.paymentProvider = provider;
  }

  getPaymentProvider(): IPaymentProvider {
    return this.paymentProvider;
  }

  getPlans(): PlanDetails[] {
    return PLANS;
  }

  getBrandTier(brandId: string): SubscriptionTier {
    return this.brandTierMap.get(brandId) || "FREE";
  }

  setBrandTier(brandId: string, tier: SubscriptionTier) {
    this.brandTierMap.set(brandId, tier);
  }

  async getBrandUsage(brandId: string): Promise<BrandUsageStatus> {
    const tier = this.getBrandTier(brandId);
    const plan = PLANS.find((p) => p.tier === tier) || PLANS[0];

    // Count successful engagements created by this brand
    const engagementsUsed = await prisma.engagement.count({
      where: { brandId },
    });

    const engagementsLimit = plan.engagementLimit;
    const isUnlimited = engagementsLimit === -1;

    let engagementsRemaining = 0;
    if (isUnlimited) {
      engagementsRemaining = 9999;
    } else {
      engagementsRemaining = Math.max(0, engagementsLimit - engagementsUsed);
    }

    const isLimitReached = !isUnlimited && engagementsUsed >= engagementsLimit;
    const canEngage = !isLimitReached;

    // Format display string strictly as specified in requirements
    let displayStatus: string = "";
    if (tier === "FREE") {
      if (engagementsUsed === 0) {
        displayStatus = "3 free engagements available";
      } else if (engagementsRemaining === 2) {
        displayStatus = "2 remaining";
      } else if (engagementsRemaining === 1) {
        displayStatus = "1 remaining";
      } else {
        displayStatus = "0 remaining";
      }
    } else {
      displayStatus = isUnlimited
        ? "Unlimited engagements available"
        : `${engagementsRemaining} remaining`;
    }

    return {
      tier,
      planName: plan.name,
      engagementsUsed,
      engagementsLimit,
      engagementsRemaining,
      displayStatus,
      isLimitReached,
      canEngage,
    };
  }

  async assertCanEngage(brandId: string): Promise<BrandUsageStatus> {
    const usage = await this.getBrandUsage(brandId);
    if (!usage.canEngage) {
      throw new HttpError(
        403,
        "You have reached your 3 free creator engagements limit. Please upgrade your plan to start more engagements."
      );
    }
    return usage;
  }

  async simulateUpgrade(params: {
    userId: string;
    brandId: string;
    targetTier: SubscriptionTier;
  }) {
    const targetPlan = PLANS.find((p) => p.tier === params.targetTier);
    if (!targetPlan) {
      throw new HttpError(400, "Invalid plan selected");
    }

    // Call payment provider abstraction
    const checkout = await this.paymentProvider.createCheckoutSession({
      userId: params.userId,
      brandId: params.brandId,
      targetTier: params.targetTier,
      successUrl: "/subscription/success",
      cancelUrl: "/pricing",
    });

    // Update brand tier
    this.setBrandTier(params.brandId, params.targetTier);

    const updatedUsage = await this.getBrandUsage(params.brandId);

    return {
      success: true,
      checkout,
      plan: targetPlan,
      usage: updatedUsage,
    };
  }
}

export const billingService = new BillingService();
