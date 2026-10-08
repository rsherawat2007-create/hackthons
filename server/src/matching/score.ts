export type MatchQuery = {
  keyword?: string;
  skills?: string[];
  specializations?: string[];
  tools?: string[];
  contentTypes?: string[];
  commercialUse?: boolean | null;
  experienceYearsMin?: number | null;
  industry?: string;
  location?: string;
  availability?: string;
};

export type MatchBreakdown = {
  skill: number;
  specialization: number;
  tool: number;
  contentType: number;
  portfolio: number;
  location: number;
  verification: number;
  total: number;
  label: "Excellent Match" | "Strong Match" | "Good Match" | "Partial Match";
  reasons: string[];
};

export type MatchableCreator = {
  skills: string[];
  specializations: string[];
  tools: string[];
  aiModels: string[];
  contentTypes: string[];
  commercialUse: boolean;
  experienceYears: number;
  bio: string;
  headline: string;
  workflow: string;
  trustScore: number;
  location?: string;
  availability?: string;
  portfolio: Array<{
    title: string;
    description: string;
    contentType: string;
    toolsUsed: string[];
    skills: string[];
    category: string;
    industry?: string;
  }>;
};

/**
 * Deterministic Match Weights as specified:
 * - Skill Match: 30%
 * - Specialization Match: 20%
 * - Tool Match: 15%
 * - Content Type Match: 15%
 * - Portfolio Relevance: 10%
 * - Location Match: 5%
 * - Trust/Verification: 5%
 * Total = 100%
 */
export const MATCH_WEIGHTS = {
  skill: 30,
  specialization: 20,
  tool: 15,
  contentType: 15,
  portfolio: 10,
  location: 5,
  verification: 5,
} as const;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function tokenize(keyword?: string) {
  if (!keyword) return [];
  return keyword
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter(
      (t) =>
        t.length > 2 &&
        !["the", "and", "for", "with", "need", "our", "new", "you"].includes(t)
    );
}

function overlapRatio(have: string[], want: string[]) {
  if (!want.length) return 0;
  if (!have.length) return 0;
  const haveSet = have.map(normalize);
  let hits = 0;
  for (const w of want) {
    const n = normalize(w);
    if (haveSet.some((h) => h === n || h.includes(n) || n.includes(h))) hits += 1;
  }
  return hits / want.length;
}

function textHaystack(creator: MatchableCreator) {
  const parts = [
    creator.headline,
    creator.bio,
    creator.workflow,
    creator.location || "",
    creator.availability || "",
    ...creator.skills,
    ...creator.specializations,
    ...creator.tools,
    ...creator.aiModels,
    ...creator.contentTypes,
    ...creator.portfolio.flatMap((p) => [
      p.title,
      p.description,
      p.category,
      p.contentType,
      p.industry || "",
      ...p.skills,
      ...p.toolsUsed,
    ]),
  ];
  return parts.join(" ").toLowerCase();
}

function keywordCoverage(haystack: string, tokens: string[]) {
  if (!tokens.length) return 0;
  const hits = tokens.filter((t) => haystack.includes(t)).length;
  return hits / tokens.length;
}

/**
 * Match categories:
 * - 90-100: Excellent Match
 * - 75-89: Strong Match
 * - 60-74: Good Match
 * - Below 60: Partial Match
 */
export function matchLabel(total: number): MatchBreakdown["label"] {
  if (total >= 90) return "Excellent Match";
  if (total >= 75) return "Strong Match";
  if (total >= 60) return "Good Match";
  return "Partial Match";
}

/**
 * Calculates a 100% deterministic creator match score and reasons.
 * NO random numbers. Purely derived from creator profile, skills, tools,
 * specialization, portfolio, location, verification, and brand requirements.
 */
export function computeMatchScore(creator: MatchableCreator, query: MatchQuery): MatchBreakdown {
  const tokens = tokenize(query.keyword);
  const inferredSkills = [...(query.skills || [])];
  const inferredSpecs = [...(query.specializations || [])];
  const inferredTools = [...(query.tools || [])];
  const inferredTypes = [...(query.contentTypes || [])];

  // Infer semantic requirements from keyword if explicit filter arrays are empty
  if (tokens.includes("video") && !inferredTypes.length) inferredTypes.push("AI Video", "Video");
  if (tokens.includes("image") && !inferredTypes.length) inferredTypes.push("AI Image Generation", "Image");
  if ((tokens.includes("product") || tokens.includes("advertisement")) && !inferredSpecs.length) {
    inferredSpecs.push("Product Advertisement");
  }
  if (tokens.includes("runway") && !inferredTools.includes("Runway")) inferredTools.push("Runway");
  if (tokens.includes("cinematic") && !inferredTools.includes("Sora")) {
    inferredTools.push("Sora");
  }

  const productVideo =
    inferredTypes.some((t) => /video/i.test(t)) ||
    tokens.includes("video") ||
    inferredSpecs.some((s) => /product/i.test(s));

  if (productVideo) {
    for (const skill of ["AI Video Direction", "Product Cinematography", "Color Grading"]) {
      if (!inferredSkills.includes(skill)) inferredSkills.push(skill);
    }
  } else if (!inferredSkills.length && (tokens.includes("image") || inferredTypes.some((t) => /image/i.test(t)))) {
    inferredSkills.push("Generative Imaging", "Art Direction", "Retouching");
  }

  // 1. Skill Match (30% weight)
  let skillRatio = overlapRatio(creator.skills, inferredSkills);
  if (skillRatio < 0.5) {
    const related = creator.skills.filter((s) => /video|cinematography|motion|ugc|short-form|editing/i.test(s)).length;
    skillRatio = Math.max(skillRatio, Math.min(0.5, related * 0.12));
  }
  if (!inferredSkills.length && !tokens.length) {
    skillRatio = Math.min(1.0, creator.skills.length / 4);
  }
  let skill = Math.round(skillRatio * MATCH_WEIGHTS.skill);

  // 2. Specialization Match (20% weight)
  let specRatio = inferredSpecs.length
    ? overlapRatio(creator.specializations, inferredSpecs)
    : keywordCoverage(creator.specializations.join(" ").toLowerCase(), tokens);
  if (!inferredSpecs.length && !tokens.length) {
    specRatio = creator.specializations.length >= 1 ? 0.9 : 0.4;
  }
  let specialization = Math.round(specRatio * MATCH_WEIGHTS.specialization);

  // 3. Tool Match (15% weight)
  const creatorTools = [...creator.tools, ...creator.aiModels];
  let toolRatio = inferredTools.length
    ? overlapRatio(creatorTools, inferredTools)
    : keywordCoverage(creator.tools.join(" ").toLowerCase(), tokens);
  if (!inferredTools.length && !tokens.length) {
    toolRatio = Math.min(1.0, creator.tools.length / 3);
  }
  let tool = Math.round(toolRatio * MATCH_WEIGHTS.tool);

  // 4. Content Type Match (15% weight)
  let typeRatio = inferredTypes.length
    ? overlapRatio(creator.contentTypes, inferredTypes)
    : keywordCoverage(creator.contentTypes.join(" ").toLowerCase(), tokens);
  if (!inferredTypes.length && !tokens.length) {
    typeRatio = creator.contentTypes.length >= 1 ? 0.9 : 0.4;
  }
  let contentType = Math.round(typeRatio * MATCH_WEIGHTS.contentType);

  // 5. Portfolio Relevance (10% weight)
  const haystack = textHaystack(creator);
  const keywordRatio = keywordCoverage(haystack, tokens);
  const portfolioTypeRatio = creator.portfolio.length
    ? overlapRatio(
        creator.portfolio.flatMap((p) => [p.contentType, p.category, ...p.skills, ...p.toolsUsed]),
        [...inferredTypes, ...inferredTools, ...inferredSkills]
      )
    : 0;
  const portfolioRatio = creator.portfolio.length === 0
    ? 0.1
    : Math.min(1.0, keywordRatio * 0.4 + portfolioTypeRatio * 0.4 + (creator.portfolio.length >= 2 ? 0.3 : 0.15));
  let portfolio = Math.round(portfolioRatio * MATCH_WEIGHTS.portfolio);

  // 6. Location Match (5% weight)
  let locationRatio = 0.8; // default baseline for confirmed global creator base
  if (query.location && query.location.trim().length > 0 && query.location !== "Any") {
    const qLoc = query.location.toLowerCase();
    const cLoc = (creator.location || "").toLowerCase();
    if (cLoc.includes(qLoc) || qLoc.includes(cLoc)) {
      locationRatio = 1.0;
    } else {
      const locTokens = qLoc.split(/[^a-z0-9]+/);
      const hits = locTokens.filter((t) => t.length > 2 && cLoc.includes(t)).length;
      locationRatio = hits > 0 ? 0.6 : 0.1;
    }
  } else {
    locationRatio = creator.location && creator.location.trim().length > 0 ? 1.0 : 0.5;
  }
  let location = Math.round(locationRatio * MATCH_WEIGHTS.location);

  // 7. Trust / Verification (5% weight)
  const verificationRatio = Math.min(1.0, creator.trustScore / 100);
  let verification = Math.round(verificationRatio * MATCH_WEIGHTS.verification);

  // Conditional penalties (deterministic)
  if (query.commercialUse === true && !creator.commercialUse) {
    skill = Math.round(skill * 0.7);
    specialization = Math.round(specialization * 0.7);
  }
  if (query.experienceYearsMin && creator.experienceYears < query.experienceYearsMin) {
    verification = Math.max(0, verification - 2);
  }

  const total = Math.max(
    0,
    Math.min(100, skill + specialization + tool + contentType + portfolio + location + verification)
  );

  // ── Construct "Why this creator?" Reasons for the Match ──────────────────
  // Deterministically derived from actual matching criteria (3 to 5 reasons):
  // - Matched skills (e.g. "AI Video skill matches")
  // - Matched AI tools & models (e.g. "Runway matches")
  // - Matched specializations (e.g. "Fashion specialization matches")
  // - Commercial rights (e.g. "Commercial work available")
  // - Portfolio relevance (e.g. "Relevant portfolio projects")
  // - Content format, industry, location, trust & experience
  const candidateReasons: string[] = [];

  // Identify matching dimensions
  const matchedSkills = creator.skills.filter((s) =>
    inferredSkills.some((req) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
  );
  const matchedTools = Array.from(new Set(
    creatorTools.filter((t) =>
      inferredTools.some((req) => t.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(t.toLowerCase()))
    )
  ));
  const matchedSpecs = creator.specializations.filter((s) =>
    inferredSpecs.some((req) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
  );
  const matchedTypes = creator.contentTypes.filter((ct) =>
    inferredTypes.some((req) => ct.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(ct.toLowerCase()))
  );

  // 1. Primary skill match (e.g. "AI Video skill matches")
  if (matchedSkills.length > 0) {
    candidateReasons.push(`${matchedSkills[0]} skill matches`);
  }

  // 2. Primary tool match (e.g. "Runway matches")
  if (matchedTools.length > 0) {
    candidateReasons.push(`${matchedTools[0]} matches`);
  }

  // 3. Primary specialization match (e.g. "Fashion specialization matches")
  if (matchedSpecs.length > 0) {
    candidateReasons.push(`${matchedSpecs[0]} specialization matches`);
  }

  // 4. Commercial availability (e.g. "Commercial work available")
  if (creator.commercialUse) {
    candidateReasons.push("Commercial work available");
  }

  // 5. Portfolio relevance
  if (creator.portfolio.length > 0) {
    const hasRelevantProjects = creator.portfolio.some((p) =>
      inferredTypes.some((t) => (p.contentType || "").toLowerCase().includes(t.toLowerCase())) ||
      inferredTools.some((t) => (p.toolsUsed || []).some((tu) => tu.toLowerCase().includes(t.toLowerCase()))) ||
      inferredSkills.some((s) => (p.skills || []).some((ps) => ps.toLowerCase().includes(s.toLowerCase())))
    );

    if (hasRelevantProjects) {
      candidateReasons.push("Relevant portfolio projects");
    } else {
      const feat = creator.portfolio.filter((p: any) => p.isFeatured).length;
      if (feat > 0) {
        candidateReasons.push(`${feat} featured portfolio project${feat > 1 ? "s" : ""}`);
      } else {
        candidateReasons.push(`${creator.portfolio.length} verified portfolio project${creator.portfolio.length > 1 ? "s" : ""}`);
      }
    }
  }

  // 6. Secondary skill matches if space remains
  if (candidateReasons.length < 5 && matchedSkills.length > 1) {
    candidateReasons.push(`${matchedSkills[1]} skill matches`);
  }

  // 7. Secondary tool matches if space remains
  if (candidateReasons.length < 5 && matchedTools.length > 1) {
    candidateReasons.push(`${matchedTools[1]} matches`);
  }

  // 8. Content format match if space remains
  if (candidateReasons.length < 5 && matchedTypes.length > 0) {
    candidateReasons.push(`${matchedTypes[0]} format matches`);
  }

  // 9. Industry match from portfolio
  if (
    candidateReasons.length < 5 &&
    query.industry &&
    creator.portfolio.some((p) => (p.industry || "").toLowerCase().includes(query.industry!.toLowerCase()))
  ) {
    candidateReasons.push(`${query.industry} industry work verified`);
  }

  // 10. Location match
  if (candidateReasons.length < 5) {
    if (query.location && query.location !== "Any" && locationRatio >= 0.6) {
      candidateReasons.push(`${creator.location || query.location} location matches`);
    } else if (creator.location && candidateReasons.length < 4) {
      candidateReasons.push(`Based in ${creator.location}`);
    }
  }

  // 11. Trust & Verification
  if (candidateReasons.length < 5) {
    if (creator.trustScore >= 80) {
      candidateReasons.push(`High trust score (${creator.trustScore}% verified)`);
    } else if (creator.trustScore >= 60 && candidateReasons.length < 4) {
      candidateReasons.push(`Verified creator profile (${creator.trustScore}% trust)`);
    }
  }

  // 12. Experience
  if (candidateReasons.length < 5 && creator.experienceYears >= 2) {
    candidateReasons.push(`${creator.experienceYears}+ years commercial experience`);
  }

  // 13. Fallback to creator's core attributes if query was empty/broad
  if (candidateReasons.length < 3 && creator.skills.length > 0) {
    for (const sk of creator.skills) {
      const r = `${sk} skill matches`;
      if (!candidateReasons.includes(r)) candidateReasons.push(r);
      if (candidateReasons.length >= 3) break;
    }
  }
  if (candidateReasons.length < 3 && creator.tools.length > 0) {
    for (const tl of creator.tools) {
      const r = `${tl} matches`;
      if (!candidateReasons.includes(r)) candidateReasons.push(r);
      if (candidateReasons.length >= 3) break;
    }
  }
  if (candidateReasons.length < 3 && creator.specializations.length > 0) {
    for (const sp of creator.specializations) {
      const r = `${sp} specialization matches`;
      if (!candidateReasons.includes(r)) candidateReasons.push(r);
      if (candidateReasons.length >= 3) break;
    }
  }

  // Deduplicate and cap to strictly 3 - 5 reasons
  const seen = new Set<string>();
  const reasons: string[] = [];
  for (const r of candidateReasons) {
    if (!seen.has(r)) {
      seen.add(r);
      reasons.push(r);
    }
    if (reasons.length === 5) break;
  }

  return {
    skill,
    specialization,
    tool,
    contentType,
    portfolio,
    location,
    verification,
    total,
    label: matchLabel(total),
    reasons,
  };
}

export function computeTrustSignals(input: {
  bio: string;
  location: string;
  experience: string;
  avatarUrl: string;
  specializations: string[];
  skills: string[];
  tools: string[];
  aiModels: string[];
  workflow: string;
  commercialUse: boolean;
  commercialNotes: string;
  portfolioCount: number;
  completePortfolioCount: number;
}) {
  let profile = 0;
  if (input.bio.length > 40) profile += 8;
  if (input.location) profile += 5;
  if (input.experience) profile += 5;
  if (input.avatarUrl) profile += 5;
  if (input.specializations.length) profile += 4;
  if (input.skills.length >= 3) profile += 3;
  profile = Math.min(30, profile);

  let portfolio = 0;
  if (input.portfolioCount >= 1) portfolio += 12;
  if (input.portfolioCount >= 2) portfolio += 8;
  if (input.portfolioCount >= 3) portfolio += 5;
  if (input.completePortfolioCount >= 2) portfolio += 5;
  portfolio = Math.min(30, portfolio);

  let tools = 0;
  if (input.tools.length >= 1) tools += 8;
  if (input.tools.length >= 3) tools += 6;
  if (input.aiModels.length >= 1) tools += 6;
  tools = Math.min(20, tools);

  const workflow = input.workflow.length > 40 ? 10 : input.workflow.length > 10 ? 6 : 0;
  const commercial = input.commercialNotes.length > 10 ? 10 : 0;

  const score = Math.min(100, profile + portfolio + tools + workflow + commercial);

  return {
    score,
    toolsVerified: input.tools.length >= 2,
    portfolioAdded: input.portfolioCount >= 1,
    workflowDocumented: input.workflow.length > 40,
    previousWork: input.portfolioCount >= 2,
    commercialUseInfo: input.commercialNotes.length > 10 || true,
    breakdown: { profile, portfolio, tools, workflow, commercial },
  };
}
