import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { refreshCreatorTrust } from "../services/verification.js";

const portfolioSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().min(10).max(5000),
  mediaUrl: z.string().min(4).max(2000),
  thumbnailUrl: z.string().min(4).max(2000),
  contentType: z.string().min(1),
  toolsUsed: z.array(z.string()).default([]),
  aiModelsUsed: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  aspectRatio: z.string().default("16:9"),
  commercialUse: z.boolean().default(true),
  commercialNotes: z.string().default(""),
  industry: z.string().default(""),
  date: z.string().optional(),
  category: z.string().default(""),
  workflow: z.string().default(""),
  isFeatured: z.boolean().optional(),
  featuredOrder: z.number().int().min(0).optional(),
});

async function requireCreatorProfile(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new HttpError(400, "Create your creator profile first");
  return profile;
}

export async function listPortfolio(req: Request, res: Response) {
  const items = await prisma.portfolio.findMany({
    where: { creatorId: req.params.creatorId },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { date: "desc" }],
  });
  res.json({ portfolio: items });
}

export async function getPortfolioItem(req: Request, res: Response) {
  const item = await prisma.portfolio.findUnique({
    where: { id: req.params.id },
    include: {
      creator: {
        include: { user: { select: { id: true, name: true } }, verification: true },
      },
    },
  });
  if (!item) throw new HttpError(404, "Portfolio item not found");
  res.json({ item });
}

export async function createPortfolio(req: Request, res: Response) {
  const profile = await requireCreatorProfile(req.user!.userId);
  const data = portfolioSchema.parse(req.body);

  if (data.isFeatured) {
    const featuredCount = await prisma.portfolio.count({
      where: { creatorId: profile.id, isFeatured: true },
    });
    if (featuredCount >= 6) {
      throw new HttpError(400, "You can feature a maximum of 6 projects as Best Work. Please unfeature another project first.");
    }
  }

  let featuredOrder = data.featuredOrder;
  if (data.isFeatured && (featuredOrder === undefined || featuredOrder === 0)) {
    const maxOrder = await prisma.portfolio.aggregate({
      where: { creatorId: profile.id, isFeatured: true },
      _max: { featuredOrder: true },
    });
    featuredOrder = (maxOrder._max.featuredOrder ?? 0) + 1;
  }

  const item = await prisma.portfolio.create({
    data: {
      ...data,
      isFeatured: data.isFeatured ?? false,
      featuredOrder: featuredOrder ?? 0,
      date: data.date ? new Date(data.date) : new Date(),
      creatorId: profile.id,
    },
  });
  await refreshCreatorTrust(profile.id);
  res.status(201).json({ item });
}

export async function updatePortfolio(req: Request, res: Response) {
  const profile = await requireCreatorProfile(req.user!.userId);
  const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.creatorId !== profile.id) throw new HttpError(404, "Portfolio item not found");
  const data = portfolioSchema.partial().parse(req.body);

  if (data.isFeatured === true && !existing.isFeatured) {
    const featuredCount = await prisma.portfolio.count({
      where: { creatorId: profile.id, isFeatured: true },
    });
    if (featuredCount >= 6) {
      throw new HttpError(400, "You can feature a maximum of 6 projects as Best Work. Please unfeature another project first.");
    }
    if (data.featuredOrder === undefined || data.featuredOrder === 0) {
      const maxOrder = await prisma.portfolio.aggregate({
        where: { creatorId: profile.id, isFeatured: true },
        _max: { featuredOrder: true },
      });
      data.featuredOrder = (maxOrder._max.featuredOrder ?? 0) + 1;
    }
  } else if (data.isFeatured === false) {
    data.featuredOrder = 0;
  }

  const item = await prisma.portfolio.update({
    where: { id: req.params.id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  await refreshCreatorTrust(profile.id);
  res.json({ item });
}

export async function toggleFeature(req: Request, res: Response) {
  const profile = await requireCreatorProfile(req.user!.userId);
  const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.creatorId !== profile.id) throw new HttpError(404, "Portfolio item not found");

  const schema = z.object({
    isFeatured: z.boolean(),
  });
  const { isFeatured } = schema.parse(req.body);

  if (isFeatured && !existing.isFeatured) {
    const featuredCount = await prisma.portfolio.count({
      where: { creatorId: profile.id, isFeatured: true },
    });
    if (featuredCount >= 6) {
      throw new HttpError(400, "You can feature a maximum of 6 projects as Best Work. Please unfeature another project first.");
    }
    const maxOrder = await prisma.portfolio.aggregate({
      where: { creatorId: profile.id, isFeatured: true },
      _max: { featuredOrder: true },
    });
    const nextOrder = (maxOrder._max.featuredOrder ?? 0) + 1;
    const item = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: { isFeatured: true, featuredOrder: nextOrder },
    });
    res.json({ item });
  } else {
    const item = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: { isFeatured: false, featuredOrder: 0 },
    });
    res.json({ item });
  }
}

export async function reorderFeatured(req: Request, res: Response) {
  const profile = await requireCreatorProfile(req.user!.userId);
  const schema = z.object({
    orderedIds: z.array(z.string()).min(1).max(6),
  });
  const { orderedIds } = schema.parse(req.body);

  const items = await prisma.portfolio.findMany({
    where: { id: { in: orderedIds }, creatorId: profile.id },
  });
  if (items.length !== orderedIds.length) {
    throw new HttpError(400, "One or more portfolio items not found or unauthorized");
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.portfolio.update({
        where: { id },
        data: { isFeatured: true, featuredOrder: index + 1 },
      })
    )
  );

  const updated = await prisma.portfolio.findMany({
    where: { creatorId: profile.id },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { date: "desc" }],
  });

  res.json({ portfolio: updated });
}

export async function deletePortfolio(req: Request, res: Response) {
  const profile = await requireCreatorProfile(req.user!.userId);
  const existing = await prisma.portfolio.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.creatorId !== profile.id) throw new HttpError(404, "Portfolio item not found");
  await prisma.portfolio.delete({ where: { id: req.params.id } });
  await refreshCreatorTrust(profile.id);
  res.json({ ok: true });
}
