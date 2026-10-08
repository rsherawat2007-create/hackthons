import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { computeMatchScore } from "../matching/score.js";

export async function brandDashboard(req: Request, res: Response) {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!brand) throw new HttpError(403, "Brand profile required");

  const [briefs, shortlists, engagements, searches] = await Promise.all([
    prisma.brief.findMany({ where: { brandId: brand.id }, orderBy: { createdAt: "desc" } }),
    prisma.shortlist.findMany({
      where: { brandId: brand.id },
      include: {
        creator: {
          include: { user: { select: { name: true } }, portfolio: { take: 1 }, verification: true },
        },
      },
    }),
    prisma.engagement.findMany({
      where: { brandId: brand.id },
      include: { creator: { include: { user: { select: { name: true } } } }, brief: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.searchHistory.findMany({ where: { brandId: brand.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const latestBrief = briefs[0];
  const creators = await prisma.creatorProfile.findMany({
    include: { user: { select: { name: true } }, portfolio: { take: 3 }, verification: true },
  });
  const recommended = creators
    .map((c) => ({
      ...c,
      match: computeMatchScore(
        c,
        latestBrief
          ? {
              keyword: `${latestBrief.title} ${latestBrief.contentType}`,
              skills: latestBrief.requiredSkills,
              tools: latestBrief.requiredTools,
              contentTypes: latestBrief.contentType ? [latestBrief.contentType] : [],
              commercialUse: latestBrief.commercialUse,
            }
          : { keyword: "AI video product" }
      ),
    }))
    .sort((a, b) => b.match.total - a.match.total)
    .slice(0, 4);

  res.json({
    stats: {
      activeBriefs: briefs.length,
      shortlisted: shortlists.length,
      contacted: engagements.length,
      projects: engagements.filter((e) => e.status === "ACCEPTED" || e.status === "IN_PROGRESS" || e.status === "COMPLETED").length,
    },
    briefs,
    shortlists,
    engagements,
    searches,
    recommended,
  });
}

export async function creatorDashboard(req: Request, res: Response) {
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: req.user!.userId },
    include: { portfolio: true, verification: true, user: true },
  });
  if (!creator) throw new HttpError(403, "Creator profile required");

  const engagements = await prisma.engagement.findMany({
    where: { creatorId: creator.id },
    include: { brief: true, brand: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    profile: creator,
    stats: {
      requests: engagements.filter((e) => e.status === "PENDING").length,
      active: engagements.filter((e) => e.status === "ACCEPTED" || e.status === "IN_PROGRESS").length,
      completed: engagements.filter((e) => e.status === "COMPLETED").length,
      trustScore: creator.trustScore,
    },
    engagements,
  });
}
