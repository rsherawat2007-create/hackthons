import type { Creator, Brief, User, Engagement } from "@/types";
import mockCreatorsRaw from "./mockCreators.json";

export const mockCreators: Creator[] = mockCreatorsRaw as unknown as Creator[];

export const mockUsers: Record<string, { user: User; token: string }> = {
  "apex@creatorhub.ai": {
    token: "mock-jwt-apex-brand-token",
    user: {
      id: "brand-user-1",
      name: "Apex Footwear",
      email: "apex@creatorhub.ai",
      role: "BRAND",
      phoneVerified: true,
      phoneMasked: "+1 *** 892",
      brandProfile: {
        id: "brand-apex-profile",
        companyName: "Apex Footwear",
        industry: "Footwear & Athletic Apparel",
        website: "https://apexfootwear.example.com",
        about: "Performance running brand scaling visual storytelling with AI-native creatives."
      }
    }
  },
  "maya@creatorhub.ai": {
    token: "mock-jwt-maya-creator-token",
    user: {
      id: "creator-user-1",
      name: "Maya Chen",
      email: "maya@creatorhub.ai",
      role: "CREATOR",
      phoneVerified: true,
      phoneMasked: "+1 *** 771",
      creatorProfile: mockCreators[0]
    }
  }
};

export const initialMockBriefs: Brief[] = [
  {
    id: "brief-1",
    brandId: "brand-apex-profile",
    title: "Premium Sneaker Launch",
    description: "30-second cinematic AI advertisement for a premium sneaker brand. Night city, material close-ups, commercial use for Instagram.",
    contentType: "AI Video",
    style: "Cinematic",
    targetAudience: "18-34 fashion-forward athletes",
    platform: "Instagram",
    aspectRatio: "9:16",
    duration: "30 seconds",
    requiredTools: ["Runway", "Sora"],
    requiredSkills: ["AI Video Direction", "Product Cinematography"],
    commercialUse: true,
    deadline: "2026-11-15",
    budget: "$8,000 – $12,000",
    deliverables: ["Master 30s", "9:16 crop", "3 stills"],
    creativeDirection: "Wet asphalt, sculptural lighting, premium materials.",
    createdAt: new Date().toISOString()
  },
  {
    id: "brief-2",
    brandId: "brand-apex-profile",
    title: "Always-on Performance Ads",
    description: "Weekly UGC-style performance creative for Meta.",
    contentType: "Social",
    style: "Native UGC",
    targetAudience: "Performance shoppers",
    platform: "Meta",
    aspectRatio: "9:16",
    duration: "15 seconds",
    requiredTools: ["Runway", "ChatGPT"],
    requiredSkills: ["Performance Creative"],
    commercialUse: true,
    deadline: "2026-12-01",
    budget: "$3,000 / month",
    deliverables: ["12 ads / month"],
    creativeDirection: "Hook-first, product-in-hand.",
    createdAt: new Date().toISOString()
  }
];

export const initialMockEngagements: Engagement[] = [
  {
    id: "eng-1",
    status: "IN_PROGRESS",
    message: "Excited to collaborate on the Apex Night Sprint launch!",
    createdAt: new Date().toISOString(),
    brief: initialMockBriefs[0],
    brand: {
      companyName: "Apex Footwear",
      user: { name: "Apex Footwear" }
    },
    creator: {
      ...mockCreators[0],
      user: mockCreators[0].user
    }
  }
];
