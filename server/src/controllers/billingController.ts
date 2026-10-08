import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { billingService } from "../billing/billingService.js";
import type { SubscriptionTier } from "../billing/types.js";

async function requireBrand(userId: string) {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw new HttpError(403, "Brand profile required");
  return brand;
}

export async function getUsage(req: Request, res: Response) {
  if (req.user?.role !== "BRAND") {
    return res.json({
      usage: {
        tier: "FREE",
        planName: "Free Trial",
        engagementsUsed: 0,
        engagementsLimit: 3,
        engagementsRemaining: 3,
        displayStatus: "3 free engagements available",
        isLimitReached: false,
        canEngage: true,
      },
      plans: billingService.getPlans(),
    });
  }

  const brand = await requireBrand(req.user.userId);
  const usage = await billingService.getBrandUsage(brand.id);
  res.json({
    usage,
    plans: billingService.getPlans(),
  });
}

export async function getPlans(req: Request, res: Response) {
  res.json({
    plans: billingService.getPlans(),
  });
}

const upgradeSchema = z.object({
  targetTier: z.enum(["FREE", "STARTER", "PRO", "ENTERPRISE"]),
});

export async function upgradePlan(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const { targetTier } = upgradeSchema.parse(req.body);

  const result = await billingService.simulateUpgrade({
    userId: req.user!.userId,
    brandId: brand.id,
    targetTier: targetTier as SubscriptionTier,
  });

  res.json(result);
}
