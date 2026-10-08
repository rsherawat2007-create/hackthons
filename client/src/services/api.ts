import type { Creator, Brief, User, Engagement } from "@/types";
import { mockCreators, mockUsers, initialMockBriefs, initialMockEngagements } from "./mockData";

const TOKEN_KEY = "creatorhub_token";
const CURRENT_USER_KEY = "creatorhub_user_fallback";
const BRIEFS_KEY = "creatorhub_briefs_fallback";
const SHORTLIST_KEY = "creatorhub_shortlist_fallback";
const ENGAGEMENTS_KEY = "creatorhub_engagements_fallback";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function getStoredBriefs(): Brief[] {
  try {
    const raw = localStorage.getItem(BRIEFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return initialMockBriefs;
}

function saveBriefs(briefs: Brief[]) {
  localStorage.setItem(BRIEFS_KEY, JSON.stringify(briefs));
}

function getStoredShortlist(): string[] {
  try {
    const raw = localStorage.getItem(SHORTLIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [mockCreators[0].id, mockCreators[1].id];
}

function saveShortlist(list: string[]) {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(list));
}

function getStoredEngagements(): Engagement[] {
  try {
    const raw = localStorage.getItem(ENGAGEMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return initialMockEngagements;
}

function saveEngagements(engs: Engagement[]) {
  localStorage.setItem(ENGAGEMENTS_KEY, JSON.stringify(engs));
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

function saveUser(u: User | null) {
  if (u) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Client-side mock handler when backend is not reached or during standalone Vercel demo
 */
function handleMockFallback<T>(path: string, options: RequestInit = {}): T {
  const method = (options.method || "GET").toUpperCase();
  const urlObj = new URL(path.startsWith("http") ? path : `https://dummy.local${path}`);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. Auth: Login
  if (pathname === "/api/auth/login" && method === "POST") {
    const email = (body.email || "").toLowerCase().trim();
    const matched = mockUsers[email];
    if (matched) {
      saveUser(matched.user);
      return { token: matched.token, user: matched.user } as T;
    }
    // Generic fallback for any email
    const isBrand = email.includes("brand") || email.includes("apex") || email.includes("nike");
    const genericUser: User = {
      id: "demo-user-" + Date.now(),
      name: email.split("@")[0].toUpperCase() || "Demo User",
      email,
      role: isBrand ? "BRAND" : "CREATOR",
      phoneVerified: true,
      phoneMasked: "+1 *** 892",
      brandProfile: isBrand
        ? {
            id: "demo-brand-profile",
            companyName: email.split("@")[0].toUpperCase() + " Inc",
            industry: "Creative Studio",
            website: "https://example.com",
            about: "Leading AI productions"
          }
        : null,
      creatorProfile: !isBrand ? mockCreators[0] : null
    };
    saveUser(genericUser);
    return { token: "demo-token-" + Date.now(), user: genericUser } as T;
  }

  // 2. Auth: Register
  if (pathname === "/api/auth/register" && method === "POST") {
    const newUser: User = {
      id: "reg-user-" + Date.now(),
      name: body.name || "Demo User",
      email: body.email,
      role: body.role || "BRAND",
      phoneVerified: true,
      phoneMasked: "+1 *** 892",
      brandProfile: body.role === "BRAND"
        ? {
            id: "reg-brand-" + Date.now(),
            companyName: body.companyName || body.name,
            industry: "Creative",
            website: "https://example.com",
            about: "AI-driven productions"
          }
        : null,
      creatorProfile: body.role === "CREATOR" ? mockCreators[0] : null
    };
    saveUser(newUser);
    return { token: "mock-token-" + Date.now(), user: newUser } as T;
  }

  // 2b. Auth: Google Login / Sign-up
  if (pathname === "/api/auth/google" && method === "POST") {
    const isBrand = (body.role || "BRAND") === "BRAND";
    const googleUser: User = {
      id: "google-user-" + Date.now(),
      name: isBrand ? "Apex Creative (Google)" : "Maya Chen (Google)",
      email: isBrand ? "apex.google@creatorhub.ai" : "maya.google@creatorhub.ai",
      role: isBrand ? "BRAND" : "CREATOR",
      phoneVerified: true,
      phoneMasked: "+1 *** 943",
      brandProfile: isBrand
        ? {
            id: "google-brand-" + Date.now(),
            companyName: "Apex Footwear & Media",
            industry: "Athletic Fashion & Performance",
            website: "https://apexfootwear.example.com",
            about: "Scaling global campaign creative with leading AI creators."
          }
        : null,
      creatorProfile: !isBrand ? mockCreators[0] : null
    };
    saveUser(googleUser);
    return { token: "google-token-" + Date.now(), user: googleUser } as T;
  }

  // 3. Auth: Me
  if (pathname === "/api/auth/me") {
    const u = getStoredUser() || mockUsers["apex@creatorhub.ai"].user;
    return { user: u } as T;
  }

  // 4. Phone status / verify
  if (pathname === "/api/auth/phone/status") {
    return { phoneVerified: true, isDevelopmentMode: true } as T;
  }
  if (pathname === "/api/auth/phone/send-otp") {
    return { message: "Demo OTP sent (Use 123456)", devOtp: "123456" } as T;
  }
  if (pathname === "/api/auth/phone/verify-otp") {
    const u = getStoredUser();
    if (u) {
      u.phoneVerified = true;
      saveUser(u);
    }
    return { success: true, phoneVerified: true, user: u } as T;
  }

  // 5. Creator Filters
  if (pathname === "/api/creators/filters") {
    return {
      skills: ["AI Video Direction", "Product Cinematography", "Motion Design", "Color Grading", "Prompt Art Direction", "Generative Imaging", "3D Generation", "Storyboarding"],
      tools: ["Runway", "Sora", "Midjourney", "Adobe Firefly", "ComfyUI", "Kling", "ChatGPT", "Stable Diffusion"],
      specializations: ["AI Video", "Product Advertisement", "Marketing Content", "Motion Graphics", "Animation", "AI Branding"],
      contentTypes: ["AI Video", "Video", "Motion Graphics", "AI Image Generation", "Social"],
      locations: ["Los Angeles, USA", "Mumbai, India", "Mexico City, Mexico", "Tokyo, Japan", "London, UK", "Berlin, Germany", "Seoul, South Korea", "Paris, France"],
      availabilities: ["Immediate", "Within 1 week", "Within 2 weeks", "Part-time only"],
      industries: ["Footwear & Athletic", "Beauty & Cosmetics", "Luxury & Watches", "Automotive", "Technology & Hardware"]
    } as T;
  }

  // 6. Creator Search & Compare
  if (pathname === "/api/creators/search" || pathname === "/api/creators") {
    const keyword = searchParams.get("keyword")?.toLowerCase() || "";
    const tool = searchParams.get("tool");
    const specialization = searchParams.get("specialization");
    const contentType = searchParams.get("contentType");
    const commercialUse = searchParams.get("commercialUse") === "true";

    let filtered = [...mockCreators];
    if (keyword) {
      filtered = filtered.filter(
        (c) =>
          c.headline.toLowerCase().includes(keyword) ||
          c.bio.toLowerCase().includes(keyword) ||
          c.skills.some((s) => s.toLowerCase().includes(keyword))
      );
    }
    if (tool) {
      filtered = filtered.filter((c) => c.tools.includes(tool) || c.aiModels.includes(tool));
    }
    if (specialization) {
      filtered = filtered.filter((c) => c.specializations.includes(specialization));
    }
    if (contentType) {
      filtered = filtered.filter((c) => c.contentTypes.includes(contentType));
    }
    if (commercialUse) {
      filtered = filtered.filter((c) => c.commercialUse);
    }

    const hasFilters = Boolean(keyword || tool || specialization || contentType);
    const suggestions = filtered.length === 0 && hasFilters
      ? [
          { type: "remove_tool", label: `Remove ${tool || "tool"} filter`, action: { key: "tool", value: "" } },
          { type: "expand_location", label: "Expand location to all regions", action: { key: "location", value: "" } },
          { type: "relax_commercial", label: "Include all creator tiers", action: { key: "commercialUse", value: "false" } }
        ]
      : [];

    return {
      results: filtered.length > 0 ? filtered : mockCreators.slice(0, 4),
      creators: filtered.length > 0 ? filtered : mockCreators.slice(0, 4),
      total: filtered.length > 0 ? filtered.length : mockCreators.length,
      suggestions: suggestions,
      relatedCreators: filtered.length === 0 ? mockCreators.slice(0, 3) : []
    } as T;
  }

  // 7. Single creator
  if (pathname.startsWith("/api/creators/") && !pathname.includes("search") && !pathname.includes("compare")) {
    const id = pathname.replace("/api/creators/", "").split("?")[0];
    const found = mockCreators.find((c) => c.id === id) || mockCreators[0];
    return { creator: found } as T;
  }

  // 8. Compare creators
  if (pathname === "/api/creators/compare") {
    const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
    const found = mockCreators.filter((c) => ids.includes(c.id));
    return { creators: found.length ? found : mockCreators.slice(0, 2) } as T;
  }

  // 9. Briefs API
  if (pathname === "/api/briefs") {
    if (method === "GET") {
      return { briefs: getStoredBriefs() } as T;
    }
    if (method === "POST") {
      const all = getStoredBriefs();
      const newBrief: Brief = {
        id: "brief-" + Date.now(),
        brandId: "brand-apex-profile",
        title: body.title || "New Campaign Brief",
        description: body.description || "",
        contentType: body.contentType || "AI Video",
        style: body.style || "Cinematic",
        targetAudience: body.targetAudience || "Broad audience",
        platform: body.platform || "Instagram",
        aspectRatio: body.aspectRatio || "9:16",
        duration: body.duration || "30 seconds",
        requiredTools: body.requiredTools || ["Runway"],
        requiredSkills: body.requiredSkills || ["AI Video Direction"],
        commercialUse: Boolean(body.commercialUse),
        deadline: body.deadline || null,
        budget: body.budget || "$5,000",
        deliverables: body.deliverables || ["1 Master Video"],
        creativeDirection: body.creativeDirection || "",
        createdAt: new Date().toISOString()
      };
      all.unshift(newBrief);
      saveBriefs(all);
      return { brief: newBrief } as T;
    }
  }

  if (pathname.startsWith("/api/briefs/")) {
    const briefId = pathname.replace("/api/briefs/", "");
    const all = getStoredBriefs();
    if (method === "DELETE") {
      saveBriefs(all.filter((b) => b.id !== briefId));
      return { success: true } as T;
    }
    if (method === "PUT") {
      const updated = all.map((b) => (b.id === briefId ? { ...b, ...body } : b));
      saveBriefs(updated);
      const target = updated.find((b) => b.id === briefId) || updated[0];
      return { brief: target } as T;
    }
    const target = all.find((b) => b.id === briefId) || all[0];
    return { brief: target, matches: mockCreators.slice(0, 3) } as T;
  }

  // 10. AI Brief Builder Generation
  if (pathname === "/api/ai/generate-brief") {
    const raw = (body.prompt || body.description || "").toString();
    return {
      brief: {
        campaignTitle: "Apex Horizon AI Showcase",
        contentType: "AI Product Video",
        style: "Cinematic Neo-Noir",
        targetAudience: "Urban professionals & athletes 18-35",
        platform: "Instagram & TikTok",
        aspectRatio: "9:16",
        duration: "30 seconds",
        requiredSkills: ["AI Video Direction", "Product Cinematography", "Motion Design"],
        recommendedTools: ["Runway", "Sora", "Midjourney"],
        commercialUse: true,
        budget: "$5,000 – $8,000",
        deliverables: ["1x 30s Master Cut", "2x 15s Cutdowns", "5x 4K Stills"],
        creativeDirection: `Built from prompt: "${raw || "High end visual campaign"}". Wet asphalt reflections, macro material textures, dynamic camera motion with DaVinci color grading.`
      }
    } as T;
  }

  // 11. Shortlist
  if (pathname === "/api/shortlist") {
    const listIds = getStoredShortlist();
    if (method === "POST") {
      const id = body.creatorId;
      if (id && !listIds.includes(id)) {
        listIds.push(id);
        saveShortlist(listIds);
      }
      return { success: true } as T;
    }
    const items = listIds.map((cid) => {
      const c = mockCreators.find((cr) => cr.id === cid) || mockCreators[0];
      return { id: "short-" + cid, creator: c };
    });
    return { shortlist: items } as T;
  }

  if (pathname.startsWith("/api/shortlist/")) {
    const cid = pathname.replace("/api/shortlist/", "");
    const list = getStoredShortlist().filter((id) => id !== cid);
    saveShortlist(list);
    return { success: true } as T;
  }

  // 12. Engagements
  if (pathname === "/api/engagements") {
    if (method === "POST") {
      const engs = getStoredEngagements();
      const targetCreator = mockCreators.find((c) => c.id === body.creatorId) || mockCreators[0];
      const targetBrief = getStoredBriefs().find((b) => b.id === body.briefId) || initialMockBriefs[0];
      const newEng: Engagement = {
        id: "eng-" + Date.now(),
        status: "PENDING",
        message: body.message || "Hi, I'd like to collaborate on our campaign!",
        createdAt: new Date().toISOString(),
        brief: targetBrief,
        brand: {
          companyName: "Apex Footwear",
          user: { name: "Apex Footwear" }
        },
        creator: {
          ...targetCreator,
          user: targetCreator.user
        }
      };
      engs.unshift(newEng);
      saveEngagements(engs);
      return { engagement: newEng } as T;
    }
    return { engagements: getStoredEngagements() } as T;
  }

  // 13. Billing & Free Usage
  if (pathname === "/api/billing/usage") {
    return {
      usage: {
        freeEngagementsRemaining: 2,
        usedEngagementsCount: 1,
        maxFreeEngagements: 3,
        canStartEngagement: true,
        subscriptionTier: "FREE",
        upgradeRequired: false
      },
      plans: [
        { id: "free", name: "Starter", price: 0, engagementsLimit: 3 },
        { id: "pro", name: "Pro Brand", price: 199, engagementsLimit: "Unlimited" }
      ]
    } as T;
  }

  // 14. Dashboards
  if (pathname === "/api/dashboard/brand") {
    return {
      briefsCount: getStoredBriefs().length,
      engagementsCount: getStoredEngagements().length,
      shortlistCount: getStoredShortlist().length,
      recentBriefs: getStoredBriefs().slice(0, 3),
      recentEngagements: getStoredEngagements().slice(0, 3)
    } as T;
  }

  if (pathname === "/api/dashboard/creator") {
    return {
      engagements: getStoredEngagements(),
      metrics: { totalViews: 1420, completedProjects: 8, rating: 4.95 }
    } as T;
  }

  // Default empty object
  return {} as T;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // If on Vercel or no custom API_BASE configured, or if fetch fails, smoothly fallback to mock engine
  try {
    const res = await fetch(url, { ...options, headers });
    // If backend 404s or is not an API server (e.g. index.html SPA rewrite), route to client mock
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || contentType.includes("text/html")) {
      return handleMockFallback<T>(path, options);
    }
    const data = await res.json().catch(() => null);
    if (!data) return handleMockFallback<T>(path, options);
    return data as T;
  } catch (_networkError) {
    return handleMockFallback<T>(path, options);
  }
}
