import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";

async function requireBrand(userId: string) {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw new HttpError(403, "Brand profile required");
  return brand;
}

export async function listShortlist(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const items = await prisma.shortlist.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "desc" },
    include: {
      creator: {
        include: {
          user: { select: { id: true, name: true } },
          portfolio: { take: 3, orderBy: { date: "desc" } },
          verification: true,
        },
      },
    },
  });
  res.json({ shortlist: items });
}

export async function addShortlist(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  const { creatorId } = z.object({ creatorId: z.string().min(1) }).parse(req.body);
  const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } });
  if (!creator) throw new HttpError(404, "Creator not found");
  const item = await prisma.shortlist.upsert({
    where: { brandId_creatorId: { brandId: brand.id, creatorId } },
    update: {},
    create: { brandId: brand.id, creatorId },
    include: { creator: { include: { user: { select: { name: true } } } } },
  });
  res.status(201).json({ item });
}

export async function removeShortlist(req: Request, res: Response) {
  const brand = await requireBrand(req.user!.userId);
  await prisma.shortlist.deleteMany({
    where: { brandId: brand.id, creatorId: req.params.creatorId },
  });
  res.json({ ok: true });
}
