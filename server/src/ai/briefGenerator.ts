import { z } from "zod";

export const generatedBriefSchema = z.object({
  campaignTitle: z.string().min(1),
  contentType: z.string().min(1),
  style: z.string().min(1),
  targetAudience: z.string().min(1),
  platform: z.string().min(1),
  aspectRatio: z.string().min(1),
  duration: z.string().min(1),
  requiredSkills: z.array(z.string()).min(1),
  recommendedTools: z.array(z.string()).min(1),
  commercialUse: z.boolean(),
  deliverables: z.array(z.string()).min(1),
  creativeDirection: z.string().min(1),
  description: z.string().optional(),
});

export type GeneratedBrief = z.infer<typeof generatedBriefSchema>;

type AiClientConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

function extractJson(text: string) {
  const fenced = text.match(/```json([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

function demoBrief(idea: string): GeneratedBrief {
  const lower = idea.toLowerCase();
  const isVideo = /video|ad|advert|reel|spot|film|cinematic/.test(lower);
  const isSneaker = /sneaker|shoe|footwear|athletic/.test(lower);
  const isBeauty = /beauty|skincare|cosmetic/.test(lower);
  const isIg = /instagram|reel|ig/.test(lower);
  const isTiktok = /tiktok/.test(lower);

  const platform = isTiktok ? "TikTok" : isIg || isVideo ? "Instagram" : "YouTube";
  const aspectRatio = platform === "YouTube" ? "16:9" : "9:16";
  const duration = isVideo ? (/30/.test(lower) ? "30 seconds" : "15-30 seconds") : "Static + motion stills";

  const campaignTitle = isSneaker
    ? "Premium Sneaker Launch"
    : isBeauty
      ? "Luminous Skincare Drop"
      : "Campaign Concept";

  const contentType = isVideo ? "AI Product Video" : "AI Image Generation";
  const style = /cinematic/.test(lower) ? "Cinematic" : isBeauty ? "Editorial luxury" : "High-end commercial";

  return {
    campaignTitle,
    contentType,
    style,
    targetAudience: isSneaker
      ? "18-34 fashion-forward athletes and streetwear buyers"
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
          "9:16 platform crop",
          "3 still frames for paid social",
          "Licensed commercial-use asset pack",
        ]
      : ["Hero stills", "Campaign crop set", "Commercial license notes"],
    creativeDirection: isSneaker
      ? "Slow-motion product hero shots, wet-asphalt night city, sculptural lighting, premium materials close-ups, confident athlete silhouette, no visible logos except the product."
      : "Premium, tactile, and brand-safe generative work with a clear commercial-use trail.",
    description: idea.trim(),
  };
}

import { aiService } from "./aiService.js";

export async function generateStructuredBrief(idea: string, config: AiClientConfig = {}) {
  const result = await aiService.generateCreativeBrief(idea);
  return {
    brief: result.data,
    source: result.source === "model" ? ("model" as const) : ("demo" as const),
    provider: result.providerName,
  };
}
