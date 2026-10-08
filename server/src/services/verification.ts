import { prisma } from "../utils/prisma.js";
import { computeTrustSignals } from "../matching/score.js";

export async function refreshCreatorTrust(creatorId: string) {
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: creatorId },
    include: { portfolio: true, user: true },
  });
  if (!creator) return null;

  const completePortfolioCount = creator.portfolio.filter(
    (p) => p.mediaUrl && p.thumbnailUrl && p.description.length > 20 && p.toolsUsed.length > 0
  ).length;

  const signals = computeTrustSignals({
    bio: creator.bio,
    location: creator.location,
    experience: creator.experience,
    avatarUrl: creator.avatarUrl,
    specializations: creator.specializations,
    skills: creator.skills,
    tools: creator.tools,
    aiModels: creator.aiModels,
    workflow: creator.workflow,
    commercialUse: creator.commercialUse,
    commercialNotes: creator.commercialNotes,
    portfolioCount: creator.portfolio.length,
    completePortfolioCount,
  });

  const emailVerified = Boolean(creator.user?.email && creator.user.email.includes("@"));
  const phoneVerified = Boolean(creator.user?.phoneVerified);
  const resumeAdded = Boolean(creator.resumeUrl && creator.resumeUrl.trim().length > 0);
  const portfolioAdded = Boolean(creator.portfolio && creator.portfolio.length >= 1);
  const toolsDocumented = Boolean(creator.tools && creator.tools.length >= 1);
  const workflowDocumented = Boolean(creator.workflow && creator.workflow.trim().length >= 20);
  const experienceAdded = Boolean(
    (creator.experience && creator.experience.trim().length > 0) ||
    (creator.experienceYears && creator.experienceYears > 0)
  );

  const verificationItems = [
    emailVerified,
    phoneVerified,
    resumeAdded,
    portfolioAdded,
    toolsDocumented,
    workflowDocumented,
    experienceAdded,
  ];
  const completedSignals = verificationItems.filter(Boolean).length;
  const profileStrength = Math.round((completedSignals / verificationItems.length) * 100);

  await prisma.creatorProfile.update({
    where: { id: creatorId },
    data: { trustScore: signals.score },
  });

  await prisma.verification.upsert({
    where: { creatorId },
    update: {
      emailVerified,
      phoneVerified,
      resumeAdded,
      portfolioAdded,
      toolsDocumented,
      workflowDocumented,
      experienceAdded,
      profileStrength,
      toolsVerified: signals.toolsVerified,
      previousWork: signals.previousWork,
      commercialUseInfo: signals.commercialUseInfo,
      score: signals.score,
    },
    create: {
      creatorId,
      emailVerified,
      phoneVerified,
      resumeAdded,
      portfolioAdded,
      toolsDocumented,
      workflowDocumented,
      experienceAdded,
      profileStrength,
      toolsVerified: signals.toolsVerified,
      previousWork: signals.previousWork,
      commercialUseInfo: signals.commercialUseInfo,
      score: signals.score,
    },
  });

  return {
    ...signals,
    emailVerified,
    phoneVerified,
    resumeAdded,
    portfolioAdded,
    toolsDocumented,
    workflowDocumented,
    experienceAdded,
    profileStrength,
  };
}

export function publicCreatorSelect() {
  return {
    id: true,
    headline: true,
    bio: true,
    location: true,
    avatarUrl: true,
    experience: true,
    experienceYears: true,
    commercialUse: true,
    commercialNotes: true,
    workflow: true,
    trustScore: true,
    skills: true,
    specializations: true,
    tools: true,
    aiModels: true,
    contentTypes: true,
    education: true,
    certificates: true,
    resumeUrl: true,
    resumeFileName: true,
    resumePublic: true,
    availability: true,
    certificatesList: {
      where: { isPublic: true },
      orderBy: { createdAt: "desc" as const },
    },
    user: { select: { id: true, name: true, email: true, role: true, phoneVerified: true } },
    portfolio: {
      orderBy: [{ isFeatured: "desc" as const }, { featuredOrder: "asc" as const }, { date: "desc" as const }],
    },
    verification: true,
  };
}
