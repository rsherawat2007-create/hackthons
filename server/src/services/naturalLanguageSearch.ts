export interface StructuredSearchCriteria {
  rawQuery: string;
  keyword?: string;
  skills: string[];
  tools: string[];
  specialization?: string;
  contentType?: string;
  industry?: string;
  location?: string;
  commercialUse?: boolean | null;
  experienceYearsMin?: number | null;
  availability?: string;
  interpretedIntent: string;
  source: "ai" | "deterministic";
}

export interface AiClientConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// ── Known Taxonomy Sets for Deterministic Parser ────────────────────────────

const KNOWN_TOOLS: Array<{ match: RegExp; name: string }> = [
  { match: /\b(?:runway(?:ml)?|gen-?3|gen-?2)\b/i, name: "Runway" },
  { match: /\b(?:sora|openai\s+sora)\b/i, name: "Sora" },
  { match: /\b(?:midjourney|mj)\b/i, name: "Midjourney" },
  { match: /\b(?:adobe\s+firefly|firefly)\b/i, name: "Adobe Firefly" },
  { match: /\b(?:davinci(?:\s+resolve)?|resolve)\b/i, name: "DaVinci Resolve" },
  { match: /\b(?:comfyui|comfy\s+ui)\b/i, name: "ComfyUI" },
  { match: /\b(?:kling(?:\s+ai)?)\b/i, name: "Kling" },
  { match: /\b(?:chatgpt|gpt-?4o?|dall-?e(?:\s*3)?)\b/i, name: "ChatGPT" },
  { match: /\b(?:stable\s+diffusion|sdxl)\b/i, name: "Stable Diffusion" },
  { match: /\b(?:flux(?:\.1)?)\b/i, name: "Flux" },
  { match: /\b(?:kaiber)\b/i, name: "Kaiber" },
  { match: /\b(?:capcut)\b/i, name: "CapCut" },
  { match: /\b(?:photoshop)\b/i, name: "Photoshop" },
  { match: /\b(?:after\s+effects)\b/i, name: "After Effects" },
];

const KNOWN_CONTENT_TYPES: Array<{ match: RegExp; name: string }> = [
  { match: /\b(?:video|film|filmmaker|filmmaking|short\s+film|motion\s+picture|reels?)\b/i, name: "AI Video" },
  { match: /\b(?:image|photo|photography|visuals|stills?|renderings?)\b/i, name: "AI Image Generation" },
  { match: /\b(?:motion\s+graphics|mograph)\b/i, name: "Motion Graphics" },
  { match: /\b(?:animation|animated|anime)\b/i, name: "Animation" },
  { match: /\b(?:social(?:\s+media)?|ugc|tiktok|instagram)\b/i, name: "Social" },
  { match: /\b(?:branding|brand\s+identity)\b/i, name: "AI Branding" },
];

const KNOWN_SPECIALIZATIONS: Array<{ match: RegExp; name: string }> = [
  { match: /\b(?:product\s+advertisement|product\s+ads?|commercial\s+ads?|product\s+commercial|product\s+spot|ad\s+campaign)\b/i, name: "Product Advertisement" },
  { match: /\b(?:ai\s+video|video\s+production|filmmaker|video\s+direction)\b/i, name: "AI Video" },
  { match: /\b(?:social\s+media(?:\s+content)?|reels|shorts|tiktok\s+ads?|ugc)\b/i, name: "Social Media Content" },
  { match: /\b(?:ai\s+image(?:\s+generation)?|concept\s+art|visual\s+look-?dev)\b/i, name: "AI Image Generation" },
  { match: /\b(?:ai\s+branding|branding|brand\s+design)\b/i, name: "AI Branding" },
  { match: /\b(?:motion\s+graphics|motion\s+design)\b/i, name: "Motion Graphics" },
  { match: /\b(?:animation|character\s+animation)\b/i, name: "Animation" },
  { match: /\b(?:marketing\s+content|performance\s+creative)\b/i, name: "Marketing Content" },
];

const KNOWN_SKILLS: Array<{ match: RegExp; name: string }> = [
  { match: /\b(?:video\s+direction|filmmaker|director|cinematic|direction)\b/i, name: "AI Video Direction" },
  { match: /\b(?:product\s+cinematography|product\s+shots?|macro|lighting\s+plates|product)\b/i, name: "Product Cinematography" },
  { match: /\b(?:color\s+grading|color\s+grade|colorist|grade)\b/i, name: "Color Grading" },
  { match: /\b(?:prompt\s+engineering|prompting|prompter|prompt\s+ops)\b/i, name: "Prompt Engineering" },
  { match: /\b(?:motion\s+design|camera\s+moves?|motion\s+rules)\b/i, name: "Motion Design" },
  { match: /\b(?:generative\s+imaging|concept\s+art|look-?dev)\b/i, name: "Generative Imaging" },
  { match: /\b(?:art\s+direction|art\s+director|aesthetic\s+direction)\b/i, name: "Art Direction" },
  { match: /\b(?:sound\s+design|soundscapes?|audio|sound)\b/i, name: "Sound Design" },
  { match: /\b(?:editing|editor|assembly|cutdowns?)\b/i, name: "Editing" },
  { match: /\b(?:retouching|cleanup|upscaling)\b/i, name: "Retouching" },
  { match: /\b(?:storyboarding|storyboard|shot\s+bible)\b/i, name: "Storyboarding" },
];

const KNOWN_INDUSTRIES: Array<{ match: RegExp; name: string }> = [
  { match: /\b(?:fashion|apparel|clothing|streetwear|runway\s+fashion|luxury\s+fashion)\b/i, name: "Footwear & Fashion" },
  { match: /\b(?:sneakers?|footwear|shoes?)\b/i, name: "Footwear & Fashion" },
  { match: /\b(?:beauty|skincare|skin-?care|cosmetics?|fragrance|perfume)\b/i, name: "Beauty & Luxury Skincare" },
  { match: /\b(?:consumer\s+tech|tech|technology|gadgets?|hardware|devices?|phone)\b/i, name: "Consumer Tech & Devices" },
  { match: /\b(?:automotive|auto|cars?|vehicles?|electric\s+vehicles?|ev)\b/i, name: "Automotive & Mobility" },
  { match: /\b(?:food|beverage|drinks?|cocktails?|restaurant|culinary)\b/i, name: "Food & Beverage" },
  { match: /\b(?:entertainment|gaming|games?|video\s+games?|music\s+video)\b/i, name: "Entertainment & Gaming" },
  { match: /\b(?:e-?commerce|retail|stores?|d2c)\b/i, name: "E-commerce & Retail" },
  { match: /\b(?:finance|financial|fintech|banking)\b/i, name: "Financial Services" },
  { match: /\b(?:creative\s+agency|agency)\b/i, name: "Creative Agency" },
];

const KNOWN_LOCATIONS: Array<{ match: RegExp; name: string }> = [
  { match: /\b(?:delhi|new\s+delhi|ncr)\b/i, name: "Delhi" },
  { match: /\b(?:mumbai|bombay)\b/i, name: "Mumbai" },
  { match: /\b(?:bengaluru|bangalore)\b/i, name: "Bengaluru" },
  { match: /\b(?:los\s+angeles|la|hollywood)\b/i, name: "Los Angeles" },
  { match: /\b(?:new\s+york(?:\s+city)?|nyc|ny|manhattan|brooklyn)\b/i, name: "New York" },
  { match: /\b(?:london|uk)\b/i, name: "London" },
  { match: /\b(?:tokyo|japan)\b/i, name: "Tokyo" },
  { match: /\b(?:berlin|germany)\b/i, name: "Berlin" },
  { match: /\b(?:paris|france)\b/i, name: "Paris" },
  { match: /\b(?:austin|texas)\b/i, name: "Austin" },
  { match: /\b(?:milan|italy)\b/i, name: "Milan" },
  { match: /\b(?:mexico\s+city|cdmx|mexico)\b/i, name: "Mexico City" },
  { match: /\b(?:dakar|senegal)\b/i, name: "Dakar" },
  { match: /\b(?:india)\b/i, name: "India" },
  { match: /\b(?:usa|united\s+states)\b/i, name: "USA" },
];

/**
 * Deterministic fallback parser: uses pattern extraction, taxonomy matching,
 * and contextual regex rules to convert natural-language input into structured criteria.
 */
export function deterministicNlSearchParser(input: string): StructuredSearchCriteria {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  // 1. Tools Extraction
  const tools: string[] = [];
  for (const t of KNOWN_TOOLS) {
    if (t.match.test(lower) && !tools.includes(t.name)) {
      tools.push(t.name);
    }
  }

  // 2. Content Type Extraction
  let contentType: string | undefined;
  for (const c of KNOWN_CONTENT_TYPES) {
    if (c.match.test(lower)) {
      contentType = c.name;
      break;
    }
  }

  // 3. Specialization Extraction
  let specialization: string | undefined;
  for (const s of KNOWN_SPECIALIZATIONS) {
    if (s.match.test(lower)) {
      specialization = s.name;
      break;
    }
  }
  // Default specialization to contentType if contentType is AI Video
  if (!specialization && contentType === "AI Video") {
    specialization = "AI Video";
  }

  // 4. Skills Extraction
  const skills: string[] = [];
  for (const sk of KNOWN_SKILLS) {
    if (sk.match.test(lower) && !skills.includes(sk.name)) {
      skills.push(sk.name);
    }
  }
  // If query mentions video or tools like Runway/Sora and no skills matched yet, infer video direction
  if (
    !skills.length &&
    (contentType === "AI Video" || tools.includes("Runway") || tools.includes("Sora"))
  ) {
    skills.push("AI Video Direction");
  }

  // 5. Industry Extraction
  let industry: string | undefined;
  for (const ind of KNOWN_INDUSTRIES) {
    if (ind.match.test(lower)) {
      industry = ind.name;
      break;
    }
  }

  // 6. Location Extraction
  let location: string | undefined;
  // Look for prepositional pattern e.g. "in Delhi", "based in London", "from Tokyo"
  const prepMatch = lower.match(/\b(?:in|based\s+in|from|located\s+in|around)\s+([a-zA-Z\s]+?)(?:\s+(?:for|with|who|using|available|$)|$)/i);
  if (prepMatch) {
    const candidate = prepMatch[1].trim();
    for (const loc of KNOWN_LOCATIONS) {
      if (loc.match.test(candidate)) {
        location = loc.name;
        break;
      }
    }
    if (!location && candidate.length >= 3 && candidate.length <= 25) {
      // Capitalize candidate words
      location = candidate.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  // If not found via preposition, check anywhere in query
  if (!location) {
    for (const loc of KNOWN_LOCATIONS) {
      if (loc.match.test(lower)) {
        location = loc.name;
        break;
      }
    }
  }

  // 7. Commercial-Use Extraction
  let commercialUse: boolean | null = null;
  if (
    /\b(?:commercial|advertisement|ads?|campaign|client\s+work|paid\s+social|monetized|licensed)\b/i.test(lower)
  ) {
    commercialUse = true;
  } else if (/\b(?:non-?commercial|personal\s+use|for\s+fun)\b/i.test(lower)) {
    commercialUse = false;
  }

  // 8. Clean Keyword Extraction (strips conversational filler)
  let cleanKeyword = raw
    .replace(/^i(?:\s*'?\s*m|\s+am)?\s+(?:looking\s+for|need|want|seeking)\s+(?:a|an)?\s*/i, "")
    .replace(/^(?:find|search|get|hire)\s+(?:me\s+)?(?:a|an)?\s*/i, "")
    .replace(/\b(?:expert|specialist|creator|artist|director)\b/gi, "")
    .replace(/^\s*(?:for\s+(?:a|an)?\s*)/i, "")
    .replace(/\b(?:in|based\s+in|from)\s+[a-zA-Z\s&]+$/i, "")
    .trim();

  // Remove multiple spaces and punctuation
  cleanKeyword = cleanKeyword.replace(/\s{2,}/g, " ").replace(/^[,.-]+|[,.-]+$/g, "").trim();

  // 9. Human-Readable Interpreted Intent Explanation
  const intentParts: string[] = [];
  if (tools.length) intentParts.push(`Tool: ${tools.join(", ")}`);
  if (specialization) intentParts.push(`Specialization: ${specialization}`);
  if (contentType && contentType !== specialization) intentParts.push(`Format: ${contentType}`);
  if (industry) intentParts.push(`Industry: ${industry}`);
  if (location) intentParts.push(`Location: ${location}`);
  if (skills.length && !specialization) intentParts.push(`Skill: ${skills[0]}`);
  if (commercialUse === true) intentParts.push("Commercial-use cleared");

  const interpretedIntent = intentParts.length > 0
    ? `Looking for ${intentParts.join(" • ")}`
    : `Searching creators matching "${cleanKeyword || raw}"`;

  return {
    rawQuery: raw,
    keyword: cleanKeyword || undefined,
    skills,
    tools,
    specialization,
    contentType,
    industry,
    location,
    commercialUse,
    interpretedIntent,
    source: "deterministic",
  };
}

import { aiService } from "../ai/aiService.js";

/**
 * Natural language search parser with AI provider abstraction and deterministic fallback.
 */
export async function parseNaturalLanguageSearch(
  input: string,
  config: AiClientConfig = {}
): Promise<StructuredSearchCriteria> {
  const result = await aiService.parseNaturalLanguageSearch(input);
  return result.data;
}
