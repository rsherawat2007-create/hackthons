import { z } from "zod";
import type { Request, Response } from "express";
import { EngagementStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";

const createSchema = z.object({
  creatorId: z.string(),
  briefId: z.string(),
  message: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  status: z.nativeEnum(EngagementStatus),
});

export async function listEngagements(req: Request, res: Response) {
  const where =
    req.user!.role === "BRAND"
      ? { brand: { userId: req.user!.userId } }
      : { creator: { userId: req.user!.userId } };

  const engagements = await prisma.engagement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      brief: true,
      brand: { include: { user: { select: { name: true } } } },
      creator: { include: { user: { select: { name: true } }, verification: true } },
    },
  });
  res.json({ engagements });
}

import { billingService } from "../billing/billingService.js";

export async function createEngagement(req: Request, res: Response) {
  if (req.user!.role !== "BRAND") throw new HttpError(403, "Only brands can send briefs");
  const data = createSchema.parse(req.body);
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!brand) throw new HttpError(400, "Brand profile required");
  const brief = await prisma.brief.findUnique({ where: { id: data.briefId } });
  if (!brief || brief.brandId !== brand.id) throw new HttpError(404, "Brief not found");
  const existing = await prisma.engagement.findFirst({
    where: { brandId: brand.id, creatorId: data.creatorId, briefId: data.briefId },
  });
  if (existing) return res.json({ engagement: existing, alreadySent: true });

  // Enforce usage limit: every brand gets 3 free engagements
  await billingService.assertCanEngage(brand.id);

  const engagement = await prisma.engagement.create({
    data: {
      brandId: brand.id,
      creatorId: data.creatorId,
      briefId: data.briefId,
      message: data.message || "",
      status: "PENDING",
    },
    include: { brief: true, creator: { include: { user: { select: { name: true } } } } },
  });

  const usage = await billingService.getBrandUsage(brand.id);
  res.status(201).json({ engagement, usage });
}

export async function updateEngagement(req: Request, res: Response) {
  const data = updateSchema.parse(req.body);
  const engagement = await prisma.engagement.findUnique({
    where: { id: req.params.id },
    include: { creator: true, brand: true },
  });
  if (!engagement) throw new HttpError(404, "Engagement not found");

  const isCreator = req.user!.role === "CREATOR" && engagement.creator.userId === req.user!.userId;
  const isBrand = req.user!.role === "BRAND" && engagement.brand.userId === req.user!.userId;
  if (!isCreator && !isBrand) throw new HttpError(403, "Not allowed");

  if (isCreator && !["ACCEPTED", "REJECTED"].includes(data.status) && data.status !== "IN_PROGRESS" && data.status !== "COMPLETED") {
    throw new HttpError(400, "Creators can accept, reject, start, or complete");
  }

  const updated = await prisma.engagement.update({
    where: { id: engagement.id },
    data: { status: data.status },
    include: {
      brief: true,
      brand: { include: { user: { select: { name: true } } } },
      creator: { include: { user: { select: { name: true } } } },
    },
  });
  res.json({ engagement: updated });
}
