import type { Request, Response } from "express";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { storageService } from "../services/storageService.js";

// Resume upload validation schema
const uploadResumeSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  base64Data: z.string().min(10), // Base64 payload
  isPublic: z.boolean().default(true),
});

// Certificate schema
const certificateSchema = z.object({
  name: z.string().min(2, "Certificate name is required").max(160),
  issuingOrganization: z.string().min(2, "Issuing organization is required").max(160),
  issueDate: z.string().max(80).optional(),
  credentialUrl: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
  fileName: z.string().max(255).optional(),
  mimeType: z.string().max(100).optional(),
  base64Data: z.string().optional(),
});

/**
 * ── RESUME MANAGEMENT ────────────────────────────────────────────────────────
 */

export async function uploadResume(req: Request, res: Response) {
  if (req.user!.role !== "CREATOR") throw new HttpError(403, "Creator role required");
  const data = uploadResumeSchema.parse(req.body);

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!creatorProfile) throw new HttpError(404, "Creator profile not found");

  // Save securely through storageService
  const stored = await storageService.saveFile({
    ownerUserId: req.user!.userId,
    originalName: data.fileName,
    mimeType: data.mimeType,
    base64Data: data.base64Data,
    isPublic: data.isPublic,
    category: "resume",
  });

  // Update profile
  const updated = await prisma.creatorProfile.update({
    where: { id: creatorProfile.id },
    data: {
      resumeUrl: stored.storageUrl,
      resumeFileName: data.fileName,
      resumePublic: data.isPublic,
    },
    select: {
      id: true,
      resumeUrl: true,
      resumeFileName: true,
      resumePublic: true,
    },
  });

  res.json({
    ok: true,
    message: "Resume uploaded successfully",
    resume: updated,
  });
}

export async function deleteResume(req: Request, res: Response) {
  if (req.user!.role !== "CREATOR") throw new HttpError(403, "Creator role required");

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!creatorProfile) throw new HttpError(404, "Creator profile not found");

  await prisma.creatorProfile.update({
    where: { id: creatorProfile.id },
    data: {
      resumeUrl: "",
      resumeFileName: "",
      resumePublic: true,
    },
  });

  res.json({ ok: true, message: "Resume removed successfully" });
}

export async function toggleResumeVisibility(req: Request, res: Response) {
  if (req.user!.role !== "CREATOR") throw new HttpError(403, "Creator role required");
  const body = z.object({ isPublic: z.boolean() }).parse(req.body);

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!creatorProfile) throw new HttpError(404, "Creator profile not found");

  const updated = await prisma.creatorProfile.update({
    where: { id: creatorProfile.id },
    data: { resumePublic: body.isPublic },
    select: {
      resumeUrl: true,
      resumeFileName: true,
      resumePublic: true,
    },
  });

  res.json({ ok: true, resume: updated });
}

/**
 * ── CERTIFICATE MANAGEMENT ──────────────────────────────────────────────────
 */

export async function listCertificates(req: Request, res: Response) {
  const { creatorId } = req.params;
  const currentUserId = req.user?.userId;

  // Check creator owner
  const profile = await prisma.creatorProfile.findUnique({
    where: { id: creatorId },
    select: { userId: true },
  });

  const isOwner = profile && profile.userId === currentUserId;

  const certificates = await prisma.certificate.findMany({
    where: {
      creatorId,
      // If not owner, show only public certificates
      ...(isOwner ? {} : { isPublic: true }),
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ certificates });
}

export async function addCertificate(req: Request, res: Response) {
  if (req.user!.role !== "CREATOR") throw new HttpError(403, "Creator role required");
  const data = certificateSchema.parse(req.body);

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!creatorProfile) throw new HttpError(404, "Creator profile not found");

  let fileUrl = "";
  let fileName = data.fileName || "";

  // If a certificate file was attached
  if (data.base64Data && data.fileName) {
    const stored = await storageService.saveFile({
      ownerUserId: req.user!.userId,
      originalName: data.fileName,
      mimeType: data.mimeType || "application/pdf",
      base64Data: data.base64Data,
      isPublic: data.isPublic,
      category: "certificate",
    });
    fileUrl = stored.storageUrl;
    fileName = data.fileName;
  }

  const cert = await prisma.certificate.create({
    data: {
      creatorId: creatorProfile.id,
      name: data.name,
      issuingOrganization: data.issuingOrganization,
      issueDate: data.issueDate || "",
      credentialUrl: data.credentialUrl || "",
      fileUrl,
      fileName,
      isPublic: data.isPublic,
    },
  });

  res.status(201).json({ ok: true, certificate: cert });
}

export async function deleteCertificate(req: Request, res: Response) {
  if (req.user!.role !== "CREATOR") throw new HttpError(403, "Creator role required");
  const { id } = req.params;

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { creator: true },
  });

  if (!cert) throw new HttpError(404, "Certificate not found");
  if (cert.creator.userId !== req.user!.userId) {
    throw new HttpError(403, "Not authorized to delete this certificate");
  }

  await prisma.certificate.delete({ where: { id } });
  res.json({ ok: true, message: "Certificate deleted successfully" });
}

/**
 * ── SECURE FILE ACCESS / STREAMING ──────────────────────────────────────────
 */

export async function serveFile(req: Request, res: Response) {
  const { fileId } = req.params;
  const currentUserId = req.user?.userId;
  const currentUserRole = req.user?.role;

  // Check file metadata against creator profile (for resume) or Certificate
  let isAuthorized = false;
  let originalName = "document.pdf";

  // Check if file is creator's resume
  const resumeOwner = await prisma.creatorProfile.findFirst({
    where: { resumeUrl: `/api/files/${fileId}` },
    include: { user: true },
  });

  if (resumeOwner) {
    originalName = resumeOwner.resumeFileName || "resume.pdf";
    if (resumeOwner.resumePublic) {
      isAuthorized = true;
    } else if (currentUserId === resumeOwner.userId) {
      isAuthorized = true;
    } else if (currentUserRole === "BRAND") {
      // Brands with active shortlist or engagement can view
      const hasEngagement = await prisma.engagement.findFirst({
        where: { creatorId: resumeOwner.id, brand: { userId: currentUserId } },
      });
      if (hasEngagement) isAuthorized = true;
    }
  } else {
    // Check if file is attached to a certificate
    const cert = await prisma.certificate.findFirst({
      where: { fileUrl: `/api/files/${fileId}` },
      include: { creator: true },
    });

    if (cert) {
      originalName = cert.fileName || `${cert.name}.pdf`;
      if (cert.isPublic) {
        isAuthorized = true;
      } else if (currentUserId === cert.creator.userId) {
        isAuthorized = true;
      }
    } else {
      // Unknown or orphaned file
      throw new HttpError(404, "File not found");
    }
  }

  if (!isAuthorized) {
    throw new HttpError(403, "This document is private and requires creator authorization to view.");
  }

  const fileInfo = await storageService.getFilePath(fileId);
  if (!fileInfo || !fs.existsSync(fileInfo.fullPath)) {
    throw new HttpError(404, "File contents not found on disk");
  }

  const stat = await fs.promises.stat(fileInfo.fullPath);

  // Set secure headers
  res.setHeader("Content-Type", fileInfo.mimeType);
  res.setHeader("Content-Length", stat.size);
  res.setHeader("X-Content-Type-Options", "nosniff");

  // If download parameter is passed, trigger download attachment
  if (req.query.download === "true" || req.query.dl === "1") {
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalName)}"`);
  } else {
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(originalName)}"`);
  }

  const stream = fs.createReadStream(fileInfo.fullPath);
  stream.pipe(res);
}
