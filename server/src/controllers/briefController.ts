import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { generateStructuredBrief } from "../ai/briefGenerator.js";
import { computeMatchScore } from "../matching/score.js";

const briefSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(8).max(8000),
  contentType: z.string().optional(),
  style: z.string().optional(),
  targetAudience: z.string().optional(),
  platform: z.string().optional(),
  aspectRatio: z.string().optional(),
  duration: z.string().optional(),
  requiredTools: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  commercialUse: z.boolean().optional(),
  deadline: z.string().nullable().optional(),
  budget: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  creativeDirection: z.string().optional(),
});

async function requireBrand(userId: string) {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw new HttpError(403, "Brand profile required");
  return brand;
}

export async function listBriefs(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const briefs = await prisma.brief.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { engagements: true } } },
  });
  res.json({ briefs });
}

export async function getBrief(req: Request, res: Response) {
  const brief = await prisma.brief.findUnique({
    where: { id: req.params.id },
    include: { engagements: true, brand: { include: { user: { select: { name: true } } } } },
  });
  if (!brief) throw new HttpError(404, "Brief not found");

  // Connect brief to creator matching system
  const query = {
    keyword: `${brief.title} ${brief.style} ${brief.contentType}`.trim(),
    skills: brief.requiredSkills,
    tools: brief.requiredTools,
    contentTypes: brief.contentType ? [brief.contentType] : [],
    commercialUse: brief.commercialUse,
  };

  const creators = await prisma.creatorProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phoneVerified: true } },
      portfolio: {
        orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { date: "desc" }],
        take: 4,
      },
      verification: true,
    },
  });

  const matches = creators
    .map((c) => {
      const match = computeMatchScore(c as any, query);
      return { ...c, match };
    })
    .sort((a, b) => b.match.total - a.match.total)
    .slice(0, 6);

  res.json({ brief, matches });
}

export async function createBrief(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const data = briefSchema.parse(req.body);
  const brief = await prisma.brief.create({
    data: {
      brandId: brand.id,
      title: data.title,
      description: data.description,
      contentType: data.contentType || "",
      style: data.style || "",
      targetAudience: data.targetAudience || "",
      platform: data.platform || "",
      aspectRatio: data.aspectRatio || "16:9",
      duration: data.duration || "",
      requiredTools: data.requiredTools || [],
      requiredSkills: data.requiredSkills || [],
      commercialUse: data.commercialUse ?? true,
      deadline: data.deadline ? new Date(data.deadline) : null,
      budget: data.budget || "",
      deliverables: data.deliverables || [],
      creativeDirection: data.creativeDirection || "",
    },
  });
  res.status(201).json({ brief });
}

export async function updateBrief(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const existing = await prisma.brief.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.brandId !== brand.id) throw new HttpError(404, "Brief not found");
  const data = briefSchema.partial().parse(req.body);
  const brief = await prisma.brief.update({
    where: { id: req.params.id },
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline === null ? null : undefined,
    },
  });
  res.json({ brief });
}

export async function deleteBrief(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const existing = await prisma.brief.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.brandId !== brand.id) throw new HttpError(404, "Brief not found");

  await prisma.brief.delete({ where: { id: req.params.id } });
  res.json({ ok: true, message: "Brief deleted successfully" });
}

export async function getBriefMatches(req: Request, res: Response) {
  const brief = await prisma.brief.findUnique({ where: { id: req.params.id } });
  if (!brief) throw new HttpError(404, "Brief not found");

  const query = {
    keyword: `${brief.title} ${brief.style} ${brief.contentType}`.trim(),
    skills: brief.requiredSkills,
    tools: brief.requiredTools,
    contentTypes: brief.contentType ? [brief.contentType] : [],
    commercialUse: brief.commercialUse,
  };

  const creators = await prisma.creatorProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phoneVerified: true } },
      portfolio: {
        orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { date: "desc" }],
        take: 6,
      },
      verification: true,
    },
  });

  const matches = creators
    .map((c) => {
      const match = computeMatchScore(c as any, query);
      return { ...c, match };
    })
    .sort((a, b) => b.match.total - a.match.total);

  res.json({ briefId: brief.id, matches, total: matches.length });
}

export async function generateBrief(req: Request, res: Response) {
  const idea = z.object({ idea: z.string().min(8).max(2000) }).parse(req.body);
  const result = await generateStructuredBrief(idea.idea);
  res.json(result);
}
