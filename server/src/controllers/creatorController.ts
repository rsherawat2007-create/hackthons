import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/errors.js";
import { publicCreatorSelect, refreshCreatorTrust } from "../services/verification.js";
import { computeMatchScore, type MatchQuery } from "../matching/score.js";
import { parseNaturalLanguageSearch } from "../services/naturalLanguageSearch.js";

const profileSchema = z.object({
  headline: z.string().max(140).optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(80).optional(),
  bio: z.string().max(4000).optional(),
  location: z.string().max(120).optional(),
  avatarUrl: z.string().max(2000).optional(),
  experience: z.string().max(80).optional(),
  experienceYears: z.number().int().min(0).max(40).optional(),
  commercialUse: z.boolean().optional(),
  commercialNotes: z.string().max(2000).optional(),
  workflow: z.string().max(8000).optional(),
  skills: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  aiModels: z.array(z.string()).optional(),
  contentTypes: z.array(z.string()).optional(),
  education: z.string().max(300).optional(),
  certificates: z.array(z.string()).optional(),
  resumeUrl: z.string().max(2000).optional(),
  availability: z.string().max(100).optional(),
});

function parseList(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseQuery(req: Request) {
  const commercial = req.query.commercialUse;
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || "9"), 10) || 9));
  const sortBy = (req.query.sortBy as "match" | "trust" | "experience" | "name") || "match";

  return {
    keyword: typeof req.query.keyword === "string" ? req.query.keyword.trim() : typeof req.query.q === "string" ? req.query.q.trim() : "",
    skills: parseList(req.query.skill as string | undefined),
    specializations: parseList(req.query.specialization as string | undefined),
    tools: parseList(req.query.tool as string | undefined),
    contentTypes: parseList(req.query.contentType as string | undefined),
    commercialUse:
      commercial === "true" ? true : commercial === "false" ? false : null,
    experienceYearsMin: req.query.experience ? Number(req.query.experience) : null,
    industry: typeof req.query.industry === "string" && req.query.industry !== "Any" && req.query.industry !== "all" ? req.query.industry.trim() : undefined,
    location: typeof req.query.location === "string" && req.query.location !== "Any" && req.query.location !== "all" ? req.query.location.trim() : undefined,
    availability: typeof req.query.availability === "string" && req.query.availability !== "Any" && req.query.availability !== "all" ? req.query.availability.trim() : undefined,
    page,
    limit,
    sortBy,
  };
}

export async function getCreatorFilters(req: Request, res: Response) {
  const creators = await prisma.creatorProfile.findMany({
    select: {
      location: true,
      availability: true,
      skills: true,
      tools: true,
      aiModels: true,
      specializations: true,
      contentTypes: true,
      portfolio: {
        select: { industry: true },
      },
    },
  });

  const locations = Array.from(new Set(creators.map((c) => c.location?.trim()).filter(Boolean))).sort();
  const availabilities = Array.from(new Set(creators.map((c) => c.availability?.trim()).filter(Boolean))).sort();
  const industries = Array.from(new Set(creators.flatMap((c) => c.portfolio.map((p) => p.industry?.trim())).filter(Boolean))).sort();
  const skills = Array.from(new Set(creators.flatMap((c) => c.skills))).sort();
  const tools = Array.from(new Set(creators.flatMap((c) => [...c.tools, ...c.aiModels]))).sort();
  const specializations = Array.from(new Set(creators.flatMap((c) => c.specializations))).sort();
  const contentTypes = Array.from(new Set(creators.flatMap((c) => c.contentTypes))).sort();

  res.json({
    locations,
    availabilities,
    industries,
    skills,
    tools,
    specializations,
    contentTypes,
  });
}

export async function parseNlSearch(req: Request, res: Response) {
  const query =
    typeof req.body?.query === "string"
      ? req.body.query
      : typeof req.query.q === "string"
      ? req.query.q
      : typeof req.query.query === "string"
      ? req.query.query
      : "";

  if (!query.trim()) {
    throw new HttpError(400, "Query string is required");
  }

  const criteria = await parseNaturalLanguageSearch(query.trim());
  res.json({ criteria });
}

export async function listCreators(req: Request, res: Response) {
  const query = parseQuery(req);
  let nlCriteria: any = null;

  // Support natural-language search when requested via nl=true / mode=nl
  const isNl =
    req.query.nl === "true" ||
    req.query.mode === "nl" ||
    req.query.naturalLanguage === "true";

  if (isNl && query.keyword && query.keyword.length > 0) {
    nlCriteria = await parseNaturalLanguageSearch(query.keyword);
    if (!query.skills?.length && nlCriteria.skills?.length) {
      query.skills = nlCriteria.skills;
    }
    if (!query.tools?.length && nlCriteria.tools?.length) {
      query.tools = nlCriteria.tools;
    }
    if (!query.specializations?.length && nlCriteria.specialization) {
      query.specializations = [nlCriteria.specialization];
    }
    if (!query.contentTypes?.length && nlCriteria.contentType) {
      query.contentTypes = [nlCriteria.contentType];
    }
    if (!query.industry && nlCriteria.industry) {
      query.industry = nlCriteria.industry;
    }
    if (!query.location && nlCriteria.location) {
      query.location = nlCriteria.location;
    }
    if (query.commercialUse === null && nlCriteria.commercialUse !== null) {
      query.commercialUse = nlCriteria.commercialUse;
    }
    if (nlCriteria.keyword) {
      query.keyword = nlCriteria.keyword;
    }
  }

  const where: any = {};

  if (query.commercialUse === true) where.commercialUse = true;
  if (query.commercialUse === false) where.commercialUse = false;
  if (query.experienceYearsMin) where.experienceYears = { gte: query.experienceYearsMin };

  if (query.location) {
    where.location = { contains: query.location, mode: "insensitive" };
  }

  if (query.availability) {
    where.availability = { contains: query.availability, mode: "insensitive" };
  }

  if (query.skills?.length) {
    where.skills = { hasSome: query.skills };
  }

  if (query.specializations?.length) {
    where.specializations = { hasSome: query.specializations };
  }

  if (query.tools?.length) {
    where.OR = [
      { tools: { hasSome: query.tools } },
      { aiModels: { hasSome: query.tools } },
    ];
  }

  if (query.contentTypes?.length) {
    where.contentTypes = { hasSome: query.contentTypes };
  }

  if (query.industry) {
    const indClause = [
      { portfolio: { some: { industry: { contains: query.industry, mode: "insensitive" } } } },
      { bio: { contains: query.industry, mode: "insensitive" } },
      { headline: { contains: query.industry, mode: "insensitive" } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: indClause }];
      delete where.OR;
    } else {
      where.OR = indClause;
    }
  }

  if (query.keyword && query.keyword.length > 0) {
    const kw = query.keyword;
    const kwClause = [
      { user: { name: { contains: kw, mode: "insensitive" } } },
      { headline: { contains: kw, mode: "insensitive" } },
      { bio: { contains: kw, mode: "insensitive" } },
      { location: { contains: kw, mode: "insensitive" } },
      { workflow: { contains: kw, mode: "insensitive" } },
      { skills: { hasSome: [kw] } },
      { tools: { hasSome: [kw] } },
      { specializations: { hasSome: [kw] } },
      { portfolio: { some: { title: { contains: kw, mode: "insensitive" } } } },
      { portfolio: { some: { description: { contains: kw, mode: "insensitive" } } } },
      { portfolio: { some: { category: { contains: kw, mode: "insensitive" } } } },
    ];
    if (where.AND) {
      where.AND.push({ OR: kwClause });
    } else if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: kwClause }];
      delete where.OR;
    } else {
      where.OR = kwClause;
    }
  }

  const creators = await prisma.creatorProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, role: true, phoneVerified: true } },
      portfolio: {
        orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { date: "desc" }],
        take: 6,
      },
      verification: true,
    },
  });

  const ranked = creators
    .map((c) => {
      const match = computeMatchScore(c as any, query);
      return { ...c, match };
    })
    .sort((a, b) => {
      if (query.sortBy === "trust") return b.trustScore - a.trustScore;
      if (query.sortBy === "experience") return b.experienceYears - a.experienceYears;
      if (query.sortBy === "name") return (a.user?.name || "").localeCompare(b.user?.name || "");
      return b.match.total - a.match.total;
    });

function buildRelaxationSuggestions(query: ReturnType<typeof parseQuery>) {
  const suggestions: Array<{
    id: string;
    label: string;
    type: "tool" | "location" | "skill" | "specialization" | "contentType" | "commercialUse" | "experience" | "keyword";
    value?: string;
  }> = [];

  // 1. Tool filter suggestion (e.g. "Remove Runway filter")
  if (query.tools?.length) {
    for (const t of query.tools) {
      suggestions.push({
        id: `remove-tool-${t.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        label: `Remove ${t} filter`,
        type: "tool",
        value: t,
      });
    }
  }

  // 2. Location filter suggestion (e.g. "Expand location")
  if (query.location) {
    suggestions.push({
      id: "expand-location",
      label: "Expand location",
      type: "location",
      value: query.location,
    });
  }

  // 3. Skill filter suggestion (e.g. "Include related skills")
  if (query.skills?.length) {
    suggestions.push({
      id: "include-related-skills",
      label: "Include related skills",
      type: "skill",
      value: query.skills[0],
    });
  }

  // 4. Specialization filter suggestion (e.g. "Remove specialization restriction")
  if (query.specializations?.length) {
    suggestions.push({
      id: "remove-specialization-restriction",
      label: "Remove specialization restriction",
      type: "specialization",
      value: query.specializations[0],
    });
  }

  // 5. Content type filter suggestion (e.g. "Include similar content types")
  if (query.contentTypes?.length) {
    suggestions.push({
      id: "include-similar-content-types",
      label: "Include similar content types",
      type: "contentType",
      value: query.contentTypes[0],
    });
  }

  // 6. Commercial use
  if (query.commercialUse !== null) {
    suggestions.push({
      id: "allow-all-commercial-use",
      label: "Include non-exclusive & editorial creators",
      type: "commercialUse",
    });
  }

  // 7. Experience
  if (query.experienceYearsMin) {
    suggestions.push({
      id: "lower-experience-requirement",
      label: "Lower minimum experience requirement",
      type: "experience",
    });
  }

  // 8. Keyword
  if (query.keyword) {
    suggestions.push({
      id: "broaden-keyword",
      label: `Remove "${query.keyword}" keyword restriction`,
      type: "keyword",
      value: query.keyword,
    });
  }

  return suggestions;
}

  const total = ranked.length;
  const page = query.page || 1;
  const limit = query.limit || 9;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginated = ranked.slice(offset, offset + limit);

  let emptyState: {
    noExactMatches: boolean;
    title: string;
    message: string;
    suggestions: ReturnType<typeof buildRelaxationSuggestions>;
  } | null = null;
  let relatedCreators: any[] = [];

  // When no creators match the exact filters, suggest relaxing filters and return related creators
  if (total === 0) {
    const suggestions = buildRelaxationSuggestions(query);
    emptyState = {
      noExactMatches: true,
      title: "No exact matches found.",
      message: "No creators match all your exact filters simultaneously.",
      suggestions,
    };

    // Query real creators from database without the hyper-strict intersecting where clauses
    const allDbCreators = await prisma.creatorProfile.findMany({
      take: 24,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, phoneVerified: true } },
        portfolio: {
          orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { date: "desc" }],
          take: 4,
        },
        verification: true,
      },
    });

    // Score real creators against the query criteria deterministically
    const scoredRelated = allDbCreators
      .map((c) => {
        const match = computeMatchScore(c as any, query);
        return { ...c, match };
      })
      .filter((c) => {
        // Must have substantive overlap with at least one requirement or meaningful match score
        const hasDirectOverlap =
          Boolean(query.tools?.length && query.tools.some((t) => c.tools.includes(t) || c.aiModels.includes(t))) ||
          Boolean(query.skills?.length && query.skills.some((s) => c.skills.includes(s))) ||
          Boolean(query.specializations?.length && query.specializations.some((s) => c.specializations.includes(s))) ||
          Boolean(query.contentTypes?.length && query.contentTypes.some((ct) => c.contentTypes.includes(ct))) ||
          Boolean(query.location && c.location?.toLowerCase().includes(query.location.toLowerCase())) ||
          Boolean(query.keyword && (
            (c.headline || "").toLowerCase().includes(query.keyword.toLowerCase()) ||
            (c.bio || "").toLowerCase().includes(query.keyword.toLowerCase()) ||
            c.skills.some((s) => s.toLowerCase().includes(query.keyword.toLowerCase())) ||
            c.tools.some((t) => t.toLowerCase().includes(query.keyword.toLowerCase()))
          ));

        return (hasDirectOverlap && c.match.total > 0) || c.match.total >= 50;
      })
      .sort((a, b) => b.match.total - a.match.total || b.trustScore - a.trustScore);

    if (scoredRelated.length > 0) {
      relatedCreators = scoredRelated.slice(0, 6);
    }
  }

  if (req.user?.role === "BRAND") {
    const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.userId } });
    if (brand) {
      await prisma.searchHistory.create({
        data: {
          brandId: brand.id,
          query: query.keyword || "",
          filters: query as object,
        },
      });
    }
  }

  res.json({
    results: paginated,
    count: paginated.length,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
    query,
    nlCriteria,
    emptyState,
    relatedCreators,
  });
}

export async function getCreator(req: Request, res: Response) {
  const creator = await prisma.creatorProfile.findFirst({
    where: { OR: [{ id: req.params.id }, { userId: req.params.id }] },
    select: publicCreatorSelect(),
  });
  if (!creator) throw new HttpError(404, "Creator not found");

  const query = parseQuery(req);
  const match = computeMatchScore(creator, query);
  res.json({ creator: { ...creator, match } });
}

export async function upsertMyProfile(req: Request, res: Response) {
  if (req.user!.role !== "CREATOR") throw new HttpError(403, "Creator role required");
  const data = profileSchema.parse(req.body);

  const { name, ...profileData } = data;

  if (name && name.trim()) {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name: name.trim() },
    });
  }

  const profile = await prisma.creatorProfile.upsert({
    where: { userId: req.user!.userId },
    update: profileData,
    create: {
      userId: req.user!.userId,
      headline: profileData.headline || "",
      bio: profileData.bio || "",
      location: profileData.location || "",
      avatarUrl: profileData.avatarUrl || "",
      experience: profileData.experience || "",
      experienceYears: profileData.experienceYears || 0,
      commercialUse: profileData.commercialUse ?? true,
      commercialNotes: profileData.commercialNotes || "",
      workflow: profileData.workflow || "",
      skills: profileData.skills || [],
      specializations: profileData.specializations || [],
      tools: profileData.tools || [],
      aiModels: profileData.aiModels || [],
      contentTypes: profileData.contentTypes || [],
      education: profileData.education || "",
      certificates: profileData.certificates || [],
      resumeUrl: profileData.resumeUrl || "",
      availability: profileData.availability || "Available for projects",
    },
  });
  await refreshCreatorTrust(profile.id);
  const fresh = await prisma.creatorProfile.findUnique({
    where: { id: profile.id },
    select: publicCreatorSelect(),
  });
  res.json({ profile: fresh });
}

export async function matchCreators(req: Request, res: Response) {
  const body = z
    .object({
      keyword: z.string().optional(),
      skills: z.array(z.string()).optional(),
      specializations: z.array(z.string()).optional(),
      tools: z.array(z.string()).optional(),
      contentTypes: z.array(z.string()).optional(),
      commercialUse: z.boolean().nullable().optional(),
      briefId: z.string().optional(),
    })
    .parse(req.body);

  let query: MatchQuery = body;
  if (body.briefId) {
    const brief = await prisma.brief.findUnique({ where: { id: body.briefId } });
    if (brief) {
      query = {
        keyword: `${brief.title} ${brief.contentType} ${brief.style}`,
        skills: brief.requiredSkills,
        tools: brief.requiredTools,
        contentTypes: brief.contentType ? [brief.contentType] : [],
        commercialUse: brief.commercialUse,
      };
    }
  }

  const creators = await prisma.creatorProfile.findMany({
    include: {
      user: { select: { id: true, name: true } },
      portfolio: true,
      verification: true,
    },
  });

  const results = creators
    .map((c) => ({ creator: c, match: computeMatchScore(c, query) }))
    .sort((a, b) => b.match.total - a.match.total);

  res.json({ results, query });
}

export async function chatWithCreatorHubAi(req: Request, res: Response) {
  const message = (req.body?.message || req.body?.query || req.body?.prompt || "").trim();
  if (!message) {
    throw new HttpError(400, "Message or prompt is required");
  }

  // 1. Extract structured search requirements:
  // - skills
  // - tools
  // - specialization
  // - contentType
  // - industry
  // - location
  // - commercialUse
  const criteria = await parseNaturalLanguageSearch(message);

  // 2. Build structured search query for creator matching
  const query: MatchQuery = {
    keyword: criteria.keyword || message,
    skills: criteria.skills,
    specializations: criteria.specialization ? [criteria.specialization] : [],
    tools: criteria.tools,
    contentTypes: criteria.contentType ? [criteria.contentType] : [],
    industry: criteria.industry,
    location: criteria.location,
    commercialUse: criteria.commercialUse,
  };

  // 3. Query creators from database
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

  // 4. Calculate deterministic match scores and reasons for every creator
  const ranked = creators
    .map((c) => {
      const match = computeMatchScore(c as any, query);
      return { ...c, match };
    })
    .sort((a, b) => b.match.total - a.match.total);

  // 5. Construct conversational assistant reply
  const topMatch = ranked[0];
  const excellentMatches = ranked.filter((r) => r.match.total >= 75).length;

  const extractedSummary: string[] = [];
  if (criteria.skills.length) extractedSummary.push(`Skills: **${criteria.skills.join(", ")}**`);
  if (criteria.tools.length) extractedSummary.push(`Tools: **${criteria.tools.join(", ")}**`);
  if (criteria.specialization) extractedSummary.push(`Specialization: **${criteria.specialization}**`);
  if (criteria.contentType && criteria.contentType !== criteria.specialization) {
    extractedSummary.push(`Format: **${criteria.contentType}**`);
  }
  if (criteria.industry) extractedSummary.push(`Industry: **${criteria.industry}**`);
  if (criteria.location) extractedSummary.push(`Location: **${criteria.location}**`);
  if (criteria.commercialUse === true) extractedSummary.push(`**Commercial Rights Cleared**`);

  let reply = "";
  if (extractedSummary.length > 0) {
    reply = `I analyzed your brief and extracted the search criteria (${extractedSummary.join(" · ")}). Based on our matching engine, I found **${ranked.length} verified creators**, with **${excellentMatches || Math.min(3, ranked.length)} top recommendations** matching your requirements:`;
  } else {
    reply = `I scanned our verified creator network based on your prompt. Here are the top matched creators ranked for your project:`;
  }

  res.json({
    reply,
    criteria: {
      skills: criteria.skills,
      tools: criteria.tools,
      specialization: criteria.specialization,
      contentType: criteria.contentType,
      industry: criteria.industry,
      location: criteria.location,
      commercialUse: criteria.commercialUse,
      interpretedIntent: criteria.interpretedIntent,
      rawQuery: criteria.rawQuery,
      source: criteria.source,
    },
    results: ranked.slice(0, 6),
    total: ranked.length,
  });
}

export async function compareCreators(req: Request, res: Response) {
  const idsParam = typeof req.query.ids === "string" ? req.query.ids : "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (ids.length === 0) {
    return res.json({ creators: [] });
  }

  const creators = await prisma.creatorProfile.findMany({
    where: {
      OR: [
        { id: { in: ids } },
        { userId: { in: ids } },
      ],
    },
    select: publicCreatorSelect(),
  });

  const query = parseQuery(req);
  const withMatch = creators.map((c) => {
    const match = computeMatchScore(c as any, query);
    return { ...c, match };
  });

  // Preserve the requested comparison order
  withMatch.sort((a, b) => {
    const indexA = ids.indexOf(a.id) !== -1 ? ids.indexOf(a.id) : ids.indexOf(a.user.id);
    const indexB = ids.indexOf(b.id) !== -1 ? ids.indexOf(b.id) : ids.indexOf(b.user.id);
    return indexA - indexB;
  });

  res.json({ creators: withMatch });
}
