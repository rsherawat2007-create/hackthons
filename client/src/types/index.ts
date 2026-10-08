export type Role = "CREATOR" | "BRAND";
export type EngagementStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";

export type MatchBreakdown = {
  skill: number;
  specialization: number;
  tool: number;
  contentType: number;
  portfolio: number;
  location: number;
  verification: number;
  total: number;
  label: "Excellent Match" | "Strong Match" | "Good Match" | "Partial Match" | string;
  reasons: string[];
};

export type ExtractedCriteria = {
  skills: string[];
  tools: string[];
  specialization?: string;
  contentType?: string;
  industry?: string;
  location?: string;
  commercialUse?: boolean | null;
  interpretedIntent?: string;
};

export type AssistantResponse = {
  reply: string;
  criteria: ExtractedCriteria;
  results: Creator[];
  total: number;
};

export type Verification = {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  resumeAdded?: boolean;
  portfolioAdded?: boolean;
  toolsDocumented?: boolean;
  workflowDocumented?: boolean;
  experienceAdded?: boolean;
  profileStrength?: number;
  toolsVerified?: boolean;
  previousWork?: boolean;
  commercialUseInfo?: boolean;
  score?: number;
};

export type PortfolioItem = {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl: string;
  contentType: string;
  toolsUsed: string[];
  aiModelsUsed: string[];
  skills: string[];
  aspectRatio: string;
  commercialUse: boolean;
  commercialNotes?: string;
  industry?: string;
  date: string;
  category: string;
  workflow: string;
  isFeatured?: boolean;
  featuredOrder?: number;
};

export type Creator = {
  id: string;
  headline: string;
  bio: string;
  location: string;
  avatarUrl: string;
  experience: string;
  experienceYears: number;
  commercialUse: boolean;
  commercialNotes: string;
  workflow: string;
  trustScore: number;
  skills: string[];
  specializations: string[];
  tools: string[];
  aiModels: string[];
  contentTypes: string[];
  education?: string;
  certificates?: string[];
  resumeUrl?: string;
  resumeFileName?: string;
  resumePublic?: boolean;
  availability?: string;
  certificatesList?: Certificate[];
  user: { id: string; name: string; email?: string; phoneVerified?: boolean; phoneMasked?: string | null };
  portfolio: PortfolioItem[];
  verification?: Verification | null;
  match?: MatchBreakdown;
};

export type Certificate = {
  id: string;
  creatorId: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  credentialUrl?: string;
  fileUrl?: string;
  fileName?: string;
  isPublic: boolean;
  createdAt: string;
};

export type Brief = {
  id: string;
  brandId: string;
  title: string;
  description: string;
  contentType: string;
  style: string;
  targetAudience: string;
  platform: string;
  aspectRatio: string;
  duration: string;
  requiredTools: string[];
  requiredSkills: string[];
  commercialUse: boolean;
  deadline: string | null;
  budget: string;
  deliverables: string[];
  creativeDirection: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phoneVerified?: boolean;
  phoneMasked?: string | null;
  creatorProfile?: Creator | null;
  brandProfile?: {
    id: string;
    companyName: string;
    industry: string;
    website: string;
    about: string;
  } | null;
};

export type Engagement = {
  id: string;
  status: EngagementStatus;
  message: string;
  createdAt: string;
  brief: Brief;
  brand: { companyName: string; user: { name: string } };
  creator: Creator & { user: { name: string } };
};

export const TOOLS = ["Midjourney", "Runway", "ChatGPT", "DALL-E", "Stable Diffusion", "Adobe Firefly", "Sora", "ComfyUI", "Kling"];
export const SPECIALIZATIONS = [
  "AI Video",
  "AI Image Generation",
  "Product Advertisement",
  "Social Media Content",
  "Animation",
  "Motion Graphics",
  "AI Branding",
  "Marketing Content",
];
export const CONTENT_TYPES = ["AI Video", "Video", "AI Image Generation", "Image", "Motion Graphics", "Animation", "Social"];
export const SKILLS = [
  "AI Video Direction",
  "Product Cinematography",
  "Motion Design",
  "Color Grading",
  "Generative Imaging",
  "Art Direction",
  "Prompt Engineering",
  "Sound Design",
  "Editing",
  "Retouching",
  "Storyboarding",
];

export const INDUSTRIES = [
  "Beauty & Luxury Skincare",
  "Footwear & Fashion",
  "Consumer Tech & Devices",
  "Automotive & Mobility",
  "Food & Beverage",
  "Entertainment & Gaming",
  "E-commerce & Retail",
  "Financial Services",
  "Creative Agency",
];

export const AVAILABILITIES = [
  "Available for projects",
  "Booking for next month",
  "Available for Q4 campaigns & selective retainer projects",
  "Part-time",
  "Available now",
];

export const LOCATIONS = [
  "Los Angeles & New York",
  "London, UK",
  "Tokyo, Japan",
  "Berlin, Germany",
  "Mumbai, India",
  "Bengaluru, India",
  "Austin, USA",
  "Milan, Italy",
  "Mexico City, Mexico",
  "Dakar, Senegal",
];
