import { z } from "zod";
import type { IAiProvider, AiResult } from "./types.js";
import { OpenAiCompatibleProvider } from "./providers/OpenAiCompatibleProvider.js";
import {
  deterministicNlSearchParser,
  type StructuredSearchCriteria,
} from "../services/naturalLanguageSearch.js";
import {
  generatedBriefSchema,
  type GeneratedBrief,
} from "./briefGenerator.js";

const nlSearchSchema = z.object({
  skills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  specialization: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  commercialUse: z.boolean().nullable().optional(),
  cleanKeyword: z.string().optional(),
  interpretedIntent: z.string().optional(),
});

function fallbackDemoBrief(idea: string): GeneratedBrief {
  const lower = idea.toLowerCase();
  const isVideo = /video|ad|advert|reel|spot|film|cinematic/.test(lower);
  const isSneaker = /sneaker|shoe|footwear|athletic|fashion/.test(lower);
  const isBeauty = /beauty|skincare|cosmetic/.test(lower);
  const isIg = /instagram|reel|ig/.test(lower);
  const isTiktok = /tiktok/.test(lower);

  const platform = isTiktok ? "TikTok" : isIg || isVideo ? "Instagram" : "YouTube";
  const aspectRatio = platform === "YouTube" ? "16:9" : "9:16";
  const duration = isVideo ? (/30/.test(lower) ? "30 seconds" : "15-30 seconds") : "Static + motion stills";

  const campaignTitle = isSneaker
    ? "Premium Fashion & Footwear Campaign"
    : isBeauty
      ? "Luminous Skincare Drop"
      : "Commercial Campaign Concept";

  const contentType = isVideo ? "AI Product Video" : "AI Image Generation";
  const style = /cinematic/.test(lower) ? "Cinematic" : isBeauty ? "Editorial luxury" : "High-end commercial";

  return {
    campaignTitle,
    contentType,
    style,
    targetAudience: isSneaker
      ? "18-34 fashion-forward consumers and trendsetters"
      : "Brand-aware millennials and Gen Z shoppers",
    platform,
    aspectRatio,
    duration,
    requiredSkills: isVideo
      ? ["AI Video Direction", "Product Cinematography", "Motion Design", "Color Grading"]
      : ["Generative Imaging", "Art Direction", "Retouching"],
    recommendedTools: isVideo
      ? ["Runway", "Sora", "Midjourney", "Adobe Firefly"]
      : ["Midjourney", "DALL-E", "Adobe Firefly"],
    commercialUse: true,
    deliverables: isVideo
      ? [
          "Master 30s cinematic cut",
          "9:16 platform cutdowns",
          "3 still frames for paid social",
          "Licensed commercial-use asset pack",
        ]
      : ["Hero stills", "Campaign crop set", "Commercial license notes"],
    creativeDirection:
      "Sculptural lighting, textural close-ups, and brand-safe generative work with a clear commercial-use trail.",
    description: idea.trim(),
  };
}

/**
 * AI Service Abstraction.
 * Decouples application logic from specific LLM vendors.
 * Handles timeouts, rate limits, failures, and deterministic fallbacks.
 */
export class AiService {
  private provider: IAiProvider;

  constructor(provider?: IAiProvider) {
    this.provider = provider || new OpenAiCompatibleProvider();
  }

  /**
   * Replace the active AI provider at runtime.
   */
  public setProvider(provider: IAiProvider): void {
    this.provider = provider;
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public isProviderAvailable(): boolean {
    return this.provider.isAvailable();
  }

  /**
   * 1. Natural-language creator search requirement extraction
   */
  public async parseNaturalLanguageSearch(
    input: string
  ): Promise<AiResult<StructuredSearchCriteria>> {
    const raw = input.trim();
    const fallback = deterministicNlSearchParser(raw);

    if (!this.provider.isAvailable()) {
      return {
        data: fallback,
        source: "fallback",
        providerName: this.provider.name,
      };
    }

    const systemPrompt = `You are a search parsing assistant for CreatorHub AI (a marketplace for Generative AI creators and filmmakers).
Analyze the user's natural-language query and convert it into structured search criteria.
Return ONLY valid JSON matching this schema:
{
  "skills": string[], // from: "AI Video Direction", "Product Cinematography", "Color Grading", "Prompt Engineering", "Motion Design", "Generative Imaging", "Art Direction", "Sound Design", "Editing", "Retouching", "Storyboarding"
  "tools": string[], // from: "Runway", "Sora", "Midjourney", "Adobe Firefly", "DaVinci Resolve", "ComfyUI", "Kling", "ChatGPT", "Stable Diffusion", "Flux", "DALL-E"
  "specialization": string | null, // from: "Product Advertisement", "AI Video", "Social Media Content", "AI Image Generation", "AI Branding", "Motion Graphics", "Animation", "Marketing Content"
  "contentType": string | null, // from: "AI Video", "Video", "AI Image Generation", "Image", "Motion Graphics", "Animation", "Social"
  "industry": string | null, // from: "Beauty & Luxury Skincare", "Footwear & Fashion", "Consumer Tech & Devices", "Automotive & Mobility", "Food & Beverage", "Entertainment & Gaming", "E-commerce & Retail"
  "location": string | null, // extracted city, region, or country (e.g. "Delhi", "London", "Los Angeles", "Tokyo", etc.)
  "commercialUse": boolean | null, // true if commercial ad / brand campaign / client work requested, false if personal
  "cleanKeyword": string, // core search query with conversational filler ("I need", "looking for", etc.) removed
  "interpretedIntent": string // concise 1-sentence user-friendly summary of what was understood
}`;

    try {
      const parsed = await this.provider.generateJson(
        {
          systemPrompt,
          userPrompt: raw,
          temperature: 0.2,
          timeoutMs: 6500, // 6.5s timeout
        },
        (data) => nlSearchSchema.parse(data)
      );

      const structuredCriteria: StructuredSearchCriteria = {
        rawQuery: raw,
        keyword: parsed.cleanKeyword || fallback.keyword,
        skills: parsed.skills.length ? parsed.skills : fallback.skills,
        tools: parsed.tools.length ? parsed.tools : fallback.tools,
        specialization: parsed.specialization || fallback.specialization,
        contentType: parsed.contentType || fallback.contentType,
        industry: parsed.industry || fallback.industry,
        location: parsed.location || fallback.location,
        commercialUse:
          typeof parsed.commercialUse === "boolean"
            ? parsed.commercialUse
            : fallback.commercialUse,
        interpretedIntent: parsed.interpretedIntent || fallback.interpretedIntent,
        source: "ai",
      };

      return {
        data: structuredCriteria,
        source: "model",
        providerName: this.provider.name,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown AI error";
      return {
        data: fallback,
        source: "fallback",
        providerName: this.provider.name,
        error: errMsg,
      };
    }
  }

  /**
   * 2. AI-assisted creative brief generation
   */
  public async generateCreativeBrief(
    idea: string
  ): Promise<AiResult<GeneratedBrief>> {
    const raw = idea.trim();
    const fallback = fallbackDemoBrief(raw);

    if (!this.provider.isAvailable()) {
      return {
        data: fallback,
        source: "fallback",
        providerName: this.provider.name,
      };
    }

    const systemPrompt = `You are a senior creative director and campaign strategist for CreatorHub AI.
Convert the user's rough campaign idea into a complete, professional creative brief.
Return ONLY valid JSON with keys:
campaignTitle (string), contentType (string), style (string), targetAudience (string),
platform (string), aspectRatio (string), duration (string),
requiredSkills (string[]), recommendedTools (string[]), commercialUse (boolean),
deliverables (string[]), creativeDirection (string), description (string).
Prefer realistic generative AI tools (Runway, Sora, Midjourney, ComfyUI, Firefly).`;

    try {
      const brief = await this.provider.generateJson(
        {
          systemPrompt,
          userPrompt: raw,
          temperature: 0.4,
          timeoutMs: 8000, // 8s timeout
        },
        (data) => generatedBriefSchema.parse({ ...fallback, ...(data as object) })
      );

      return {
        data: brief,
        source: "model",
        providerName: this.provider.name,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown AI error";
      return {
        data: fallback,
        source: "fallback",
        providerName: this.provider.name,
        error: errMsg,
      };
    }
  }
}

// Global singleton instance
export const aiService = new AiService();
