import { PrismaClient, Role, EngagementStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeTrustSignals } from "../server/src/matching/score.js";

const prisma = new PrismaClient();
const PASSWORD = "DemoPass123!";

type CreatorSeed = {
  name: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  avatarUrl: string;
  experience: string;
  experienceYears: number;
  commercialUse: boolean;
  commercialNotes: string;
  workflow: string;
  skills: string[];
  specializations: string[];
  tools: string[];
  aiModels: string[];
  contentTypes: string[];
  portfolio: Array<{
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
    date: string;
    category: string;
    workflow: string;
  }>;
};

const avatars = {
  maya: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  arjun: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
  sofia: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  kenji: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  priya: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  luca: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  amina: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  noah: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=400&q=80",
  elena: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
  harper: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
};

const imgs = {
  sneakerNight: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
  sneakerStudio: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1600&q=80",
  cityRun: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=80",
  motion: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
  product: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
  film: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80",
  abstract: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb8?auto=format&fit=crop&w=1600&q=80",
  fashion: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
  neon: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1600&q=80",
  watch: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1600&q=80",
  car: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
  social: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=1600&q=80",
  character: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1600&q=80",
  brand: "https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&w=1600&q=80",
};

const creators: CreatorSeed[] = [
  {
    name: "Maya Chen",
    email: "maya@creatorhub.ai",
    headline: "Cinematic AI product films for premium brands",
    bio: "Director specializing in AI-native product advertisements. I combine Runway Gen-3, Sora, and practical lighting plates to deliver commercial-ready 9:16 and 16:9 films for footwear, devices, and automotive launches.",
    location: "Los Angeles, USA",
    avatarUrl: avatars.maya,
    experience: "6 years in motion / 3 years AI production",
    experienceYears: 6,
    commercialUse: true,
    commercialNotes: "All showcased work is cleared for paid social and OOH with documented prompt + plate licensing.",
    workflow:
      "1) Shot bible and product CAD/photo capture 2) Midjourney look-dev 3) Runway Gen-3 motion plates with camera moves 4) Sora hero inserts 5) Flame-style composite and grade in DaVinci 6) Platform crops + usage report.",
    skills: ["AI Video Direction", "Product Cinematography", "Motion Design", "Color Grading", "Prompt Art Direction"],
    specializations: ["AI Video", "Product Advertisement", "Marketing Content"],
    tools: ["Runway", "Sora", "Midjourney", "Adobe Firefly", "DaVinci Resolve"],
    aiModels: ["Runway Gen-3", "Sora", "Flux"],
    contentTypes: ["AI Video", "Video", "Motion Graphics"],
    portfolio: [
      {
        title: "Apex Night Sprint — Premium Sneaker Film",
        description:
          "30-second cinematic AI advertisement for a limited sneaker drop. Wet asphalt, neon signage, macro foam-texture inserts, and a confident night runner silhouette.",
        mediaUrl: imgs.sneakerNight,
        thumbnailUrl: imgs.sneakerNight,
        contentType: "AI Video",
        toolsUsed: ["Runway", "Sora", "Midjourney"],
        aiModelsUsed: ["Runway Gen-3", "Sora"],
        skills: ["Product Cinematography", "AI Video Direction"],
        aspectRatio: "9:16",
        commercialUse: true,
        date: "2026-06-12",
        category: "Product Advertisement",
        workflow: "Look-dev stills → Runway motion → Sora hero insert → grade.",
      },
      {
        title: "Studio Orbit Watch Spot",
        description: "Luxury product orbit with generative reflections and commercial-safe materials.",
        mediaUrl: imgs.watch,
        thumbnailUrl: imgs.watch,
        contentType: "AI Video",
        toolsUsed: ["Runway", "Adobe Firefly"],
        aiModelsUsed: ["Runway Gen-3"],
        skills: ["Product Cinematography", "Color Grading"],
        aspectRatio: "16:9",
        commercialUse: true,
        date: "2026-03-02",
        category: "Product Advertisement",
        workflow: "Product photography + generative extension + motion interpolate.",
      },
      {
        title: "City Pack Launch Cutdowns",
        description: "A family of 6s and 15s cutdowns for paid Instagram traffic.",
        mediaUrl: imgs.cityRun,
        thumbnailUrl: imgs.cityRun,
        contentType: "AI Video",
        toolsUsed: ["Runway", "Sora"],
        aiModelsUsed: ["Sora"],
        skills: ["Motion Design", "Marketing Content"],
        aspectRatio: "9:16",
        commercialUse: true,
        date: "2025-11-20",
        category: "Social Media Content",
        workflow: "Master 30s → platform-safe recrops with type-safe end cards.",
      },
    ],
  },
  {
    name: "Arjun Mehta",
    email: "arjun@creatorhub.ai",
    headline: "AI video ads with athletic energy and material truth",
    bio: "Former agency editor now building AI product videos for sportswear. Obsessed with fabric physics, camera language, and briefs that actually ship.",
    location: "Mumbai, India",
    avatarUrl: avatars.arjun,
    experience: "8 years editorial / 2 years gen video",
    experienceYears: 8,
    commercialUse: true,
    commercialNotes: "Commercial license packs delivered with every engagement. No celebrity likeness.",
    workflow:
      "Brief deconstruction, reference boards, Runway motion tests, fabric-accurate stills, editorial pacing, legal usage sheet.",
    skills: ["AI Video Direction", "Editing", "Product Cinematography", "Sound Design"],
    specializations: ["AI Video", "Product Advertisement", "Social Media Content"],
    tools: ["Runway", "Kling", "ChatGPT", "Adobe Firefly"],
    aiModels: ["Runway Gen-3", "Kling 1.6"],
    contentTypes: ["AI Video", "Video"],
    portfolio: [
      {
        title: "Velocity Foam — Court Film",
        description: "High-energy sneaker product video with generative crowd bokeh and legal-safe athletes.",
        mediaUrl: imgs.sneakerStudio,
        thumbnailUrl: imgs.sneakerStudio,
        contentType: "AI Video",
        toolsUsed: ["Runway", "Kling"],
        aiModelsUsed: ["Runway Gen-3"],
        skills: ["AI Video Direction", "Editing"],
        aspectRatio: "9:16",
        commercialUse: true,
        date: "2026-05-01",
        category: "Product Advertisement",
        workflow: "Runway plates + editorial cut + mix.",
      },
      {
        title: "Monsoon Pack Socials",
        description: "15s vertical ads emphasizing weatherproof materials.",
        mediaUrl: imgs.cityRun,
        thumbnailUrl: imgs.cityRun,
        contentType: "AI Video",
        toolsUsed: ["Runway"],
        aiModelsUsed: ["Runway Gen-3"],
        skills: ["Social Media Content"],
        aspectRatio: "9:16",
        commercialUse: true,
        date: "2026-01-18",
        category: "Social Media Content",
        workflow: "Prompted rain plates, product composite, captions.",
      },
    ],
  },
  {
    name: "Sofia Alvarez",
    email: "sofia@creatorhub.ai",
    headline: "Motion graphics + generative animation for brand worlds",
    bio: "I fuse After Effects craft with Runway and Firefly to build logo worlds, packshots, and kinetic type for launches.",
    location: "Mexico City, Mexico",
    avatarUrl: avatars.sofia,
    experience: "5 years motion design",
    experienceYears: 5,
    commercialUse: true,
    commercialNotes: "Brand-kit safe. Type and logo supplied by client; generative only for environments.",
    workflow: "Styleframes in Midjourney → motion tests in Runway → AE finishing → Lottie/MP4 delivery.",
    skills: ["Motion Graphics", "Animation", "Art Direction", "Typography"],
    specializations: ["Motion Graphics", "Animation", "AI Branding"],
    tools: ["Runway", "Adobe Firefly", "Midjourney", "After Effects"],
    aiModels: ["Firefly Video", "Flux"],
    contentTypes: ["Motion Graphics", "Animation", "AI Video"],
    portfolio: [
      {
        title: "Neon Identity System",
        description: "Animated brand world with generative particles and custom type.",
        mediaUrl: imgs.neon,
        thumbnailUrl: imgs.neon,
        contentType: "Motion Graphics",
        toolsUsed: ["Runway", "Adobe Firefly"],
        aiModelsUsed: ["Firefly Video"],
        skills: ["Motion Graphics", "AI Branding"],
        aspectRatio: "16:9",
        commercialUse: true,
        date: "2026-04-11",
        category: "AI Branding",
        workflow: "Styleframes, motion, brand lockup.",
      },
      {
        title: "Packshot Ballet",
        description: "Product orbit with generative caustics for a fragrance line.",
        mediaUrl: imgs.beauty,
        thumbnailUrl: imgs.beauty,
        contentType: "AI Video",
        toolsUsed: ["Runway", "Midjourney"],
        aiModelsUsed: ["Flux"],
        skills: ["Animation", "Product Cinematography"],
        aspectRatio: "4:5",
        commercialUse: true,
        date: "2025-12-08",
        category: "Product Advertisement",
        workflow: "Look-dev stills to motion interpolate.",
      },
    ],
  },
  {
    name: "Kenji Tanaka",
    email: "kenji@creatorhub.ai",
    headline: "Still-image worldbuilding for luxury campaigns",
    bio: "Generative photographer. Midjourney, ComfyUI, and Firefly pipelines for print, OOH, and e-commerce hero stills.",
    location: "Tokyo, Japan",
    avatarUrl: avatars.kenji,
    experience: "10 years photography",
    experienceYears: 10,
    commercialUse: true,
    commercialNotes: "Full commercial stills with model-release-free scenes and documented seeds.",
    workflow: "Art direction → Midjourney/ComfyUI → inpaint → print grade → usage memo.",
    skills: ["Generative Imaging", "Art Direction", "Retouching", "Prompt Engineering"],
    specializations: ["AI Image Generation", "AI Branding", "Product Advertisement"],
    tools: ["Midjourney", "ComfyUI", "Adobe Firefly", "DALL-E"],
    aiModels: ["Midjourney v6", "SDXL", "Flux"],
    contentTypes: ["Image", "AI Image Generation"],
    portfolio: [
      {
        title: "Silent Pavilion — Fragrance Stills",
        description: "Editorial stills with architectural calm and product honesty.",
        mediaUrl: imgs.beauty,
        thumbnailUrl: imgs.beauty,
        contentType: "AI Image Generation",
        toolsUsed: ["Midjourney", "ComfyUI"],
        aiModelsUsed: ["Midjourney v6"],
        skills: ["Art Direction", "Generative Imaging"],
        aspectRatio: "4:5",
        commercialUse: true,
        date: "2026-02-14",
        category: "AI Branding",
        workflow: "Prompt library + ControlNet pose + grade.",
      },
      {
        title: "Object Studies",
        description: "Catalog-ready product stills with generative surfaces.",
        mediaUrl: imgs.product,
        thumbnailUrl: imgs.product,
        contentType: "AI Image Generation",
        toolsUsed: ["Adobe Firefly", "DALL-E"],
        aiModelsUsed: ["Firefly 3"],
        skills: ["Retouching", "Product Advertisement"],
        aspectRatio: "1:1",
        commercialUse: true,
        date: "2025-09-30",
        category: "Product Advertisement",
        workflow: "Reference capture, generative extend, retouch.",
      },
      {
        title: "Textile Atlas",
        description: "Macro material library for apparel lookbooks.",
        mediaUrl: imgs.fashion,
        thumbnailUrl: imgs.fashion,
        contentType: "AI Image Generation",
        toolsUsed: ["ComfyUI", "Stable Diffusion"],
        aiModelsUsed: ["SDXL"],
        skills: ["Generative Imaging"],
        aspectRatio: "3:2",
        commercialUse: true,
        date: "2025-07-12",
        category: "Marketing Content",
        workflow: "LoRA on fabric photos, tiled exports.",
      },
    ],
  },
  {
    name: "Priya Nair",
    email: "priya@creatorhub.ai",
    headline: "Always-on social content systems with AI production",
    bio: "I help brands ship weekly generative social without looking sloppy. Scripts, stills, short video, and community-safe captions.",
    location: "Bengaluru, India",
    avatarUrl: avatars.priya,
    experience: "4 years social / 2 years AI ops",
    experienceYears: 4,
    commercialUse: true,
    commercialNotes: "Platform-safe commercial content. No unlicensed music or faces.",
    workflow: "Content calendar → ChatGPT scripts → Midjourney stills → Runway cutdowns → scheduling kit.",
    skills: ["Social Strategy", "Copywriting", "Short-form Video", "Prompt Ops"],
    specializations: ["Social Media Content", "Marketing Content", "AI Video"],
    tools: ["ChatGPT", "Runway", "Midjourney", "CapCut"],
    aiModels: ["GPT-4o", "Runway Gen-3"],
    contentTypes: ["Social", "AI Video", "Image"],
    portfolio: [
      {
        title: "30-Day Drop Calendar",
        description: "Always-on generative social system for a DTC apparel brand.",
        mediaUrl: imgs.social,
        thumbnailUrl: imgs.social,
        contentType: "Social",
        toolsUsed: ["ChatGPT", "Midjourney"],
        aiModelsUsed: ["GPT-4o"],
        skills: ["Social Strategy", "Copywriting"],
        aspectRatio: "4:5",
        commercialUse: true,
        date: "2026-04-02",
        category: "Social Media Content",
        workflow: "Calendar, stills, captions, variants.",
      },
      {
        title: "Reel Pack: Ingredient Stories",
        description: "15s educational reels with generative B-roll.",
        mediaUrl: imgs.beauty,
        thumbnailUrl: imgs.beauty,
        contentType: "AI Video",
        toolsUsed: ["Runway", "ChatGPT"],
        aiModelsUsed: ["Runway Gen-3"],
        skills: ["Short-form Video"],
        aspectRatio: "9:16",
        commercialUse: true,
        date: "2026-01-09",
        category: "Marketing Content",
        workflow: "Script → B-roll → captions.",
      },
    ],
  },
  {
    name: "Luca Rossi",
    email: "luca@creatorhub.ai",
    headline: "AI branding systems and campaign worlds",
    bio: "I design identity systems that start generative and end production-ready: color, type, motion rules, and asset libraries.",
    location: "Milan, Italy",
    avatarUrl: avatars.luca,
    experience: "7 years branding",
    experienceYears: 7,
    commercialUse: true,
    commercialNotes: "Brand IP assigned to client. Generative references logged.",
    workflow: "Positioning workshop → visual territories in Midjourney/Firefly → lockups → motion rules.",
    skills: ["Brand Strategy", "Art Direction", "Generative Imaging", "Motion Rules"],
    specializations: ["AI Branding", "Marketing Content", "AI Image Generation"],
    tools: ["Midjourney", "Adobe Firefly", "ChatGPT", "Figma"],
    aiModels: ["Midjourney v6", "Firefly 3"],
    contentTypes: ["Image", "Motion Graphics", "AI Branding"],
    portfolio: [
      {
        title: "Northstar Rebrand Territories",
        description: "Three visual territories for a creative agency refresh.",
        mediaUrl: imgs.brand,
        thumbnailUrl: imgs.brand,
        contentType: "AI Branding",
        toolsUsed: ["Midjourney", "Adobe Firefly"],
        aiModelsUsed: ["Midjourney v6"],
        skills: ["Brand Strategy", "Art Direction"],
        aspectRatio: "16:9",
        commercialUse: true,
        date: "2026-03-21",
        category: "AI Branding",
        workflow: "Territories, lockups, motion chips.",
      },
      {
        title: "Capsule Lookbook",
        description: "Fashion campaign stills with a consistent generative lighting rig.",
        mediaUrl: imgs.fashion,
        thumbnailUrl: imgs.fashion,
        contentType: "AI Image Generation",
        toolsUsed: ["Midjourney"],
        aiModelsUsed: ["Midjourney v6"],
        skills: ["Generative Imaging"],
        aspectRatio: "4:5",
        commercialUse: true,
        date: "2025-10-05",
        category: "Marketing Content",
        workflow: "Character sheet + lighting LoRA.",
      },
    ],
  },
  {
    name: "Amina Diallo",
    email: "amina@creatorhub.ai",
    headline: "Character animation and stylized AI worlds",
    bio: "I build characters and short animated loops with Runway, Kaiber, and hand-drawn pass-throughs.",
    location: "Dakar, Senegal",
    avatarUrl: avatars.amina,
    experience: "6 years animation",
    experienceYears: 6,
    commercialUse: true,
    commercialNotes: "Original characters. No third-party IP mashups.",
    workflow: "Character bible → stills → Runway/Kaiber motion → hand-fix pass → sound.",
    skills: ["Character Design", "Animation", "Storyboarding", "Worldbuilding"],
    specializations: ["Animation", "AI Video", "Motion Graphics"],
    tools: ["Runway", "Kaiber", "Midjourney", "Procreate"],
    aiModels: ["Runway Gen-3", "Kaiber 2"],
    contentTypes: ["Animation", "AI Video"],
    portfolio: [
      {
        title: "Harbor Sprite Loop",
        description: "Stylized character loop for a game teaser.",
        mediaUrl: imgs.character,
        thumbnailUrl: imgs.character,
        contentType: "Animation",
        toolsUsed: ["Runway", "Midjourney"],
        aiModelsUsed: ["Runway Gen-3"],
        skills: ["Character Design", "Animation"],
        aspectRatio: "1:1",
        commercialUse: true,
        date: "2026-02-02",
        category: "Animation",
        workflow: "Bible, still, motion, paint-over.",
      },
      {
        title: "Festival Opener",
        description: "30s stylized opener with generative crowd energy.",
        mediaUrl: imgs.abstract,
        thumbnailUrl: imgs.abstract,
        contentType: "AI Video",
        toolsUsed: ["Kaiber", "Runway"],
        aiModelsUsed: ["Kaiber 2"],
        skills: ["Worldbuilding", "Animation"],
        aspectRatio: "16:9",
        commercialUse: true,
        date: "2025-08-19",
        category: "Motion Graphics",
        workflow: "Boards to generative pass.",
      },
    ],
  },
  {
    name: "Noah Brooks",
    email: "noah@creatorhub.ai",
    headline: "Sora-first cinematic storytelling",
    bio: "I treat Sora and Runway like a virtual studio. Narrative spots, automotive, and travel films with a documentary eye.",
    location: "London, UK",
    avatarUrl: avatars.noah,
    experience: "9 years documentary / 2 years gen video",
    experienceYears: 9,
    commercialUse: true,
    commercialNotes: "Travel and automotive work cleared for global paid media.",
    workflow: "Treatment → animatic → Sora hero takes → Runway coverage → documentary grade.",
    skills: ["Cinematography", "AI Video Direction", "Treatment Writing", "Soundscapes"],
    specializations: ["AI Video", "Marketing Content"],
    tools: ["Sora", "Runway", "ChatGPT", "DaVinci Resolve"],
    aiModels: ["Sora", "Runway Gen-3"],
    contentTypes: ["AI Video", "Video"],
    portfolio: [
      {
        title: "Coastal GT",
        description: "Cinematic automotive film with generative weather and legal-safe plates.",
        mediaUrl: imgs.car,
        thumbnailUrl: imgs.car,
        contentType: "AI Video",
        toolsUsed: ["Sora", "Runway"],
        aiModelsUsed: ["Sora"],
        skills: ["Cinematography", "AI Video Direction"],
        aspectRatio: "16:9",
        commercialUse: true,
        date: "2026-05-22",
        category: "Marketing Content",
        workflow: "Treatment, Sora, coverage, grade.",
      },
      {
        title: "Night Market Cut",
        description: "Travel brand film with handheld energy.",
        mediaUrl: imgs.film,
        thumbnailUrl: imgs.film,
        contentType: "AI Video",
        toolsUsed: ["Sora"],
        aiModelsUsed: ["Sora"],
        skills: ["Treatment Writing"],
        aspectRatio: "16:9",
        commercialUse: true,
        date: "2025-12-01",
        category: "AI Video",
        workflow: "Doc-style prompts, selects, mix.",
      },
    ],
  },
  {
    name: "Elena Volkov",
    email: "elena@creatorhub.ai",
    headline: "Photoreal product ads with DALL-E and Stable Diffusion",
    bio: "I specialize in catalog and paid-social stills that survive legal review. ControlNet, product masks, and commercial lighting.",
    location: "Berlin, Germany",
    avatarUrl: avatars.elena,
    experience: "5 years CGI adjacent",
    experienceYears: 5,
    commercialUse: true,
    commercialNotes: "Product-true geometry. Client CAD preferred. Commercial-use stills only.",
    workflow: "Product mask → ControlNet → SD/DALL-E lighting variants → retouch.",
    skills: ["Product Visualization", "ControlNet", "Retouching", "Paid Social Crops"],
    specializations: ["Product Advertisement", "AI Image Generation"],
    tools: ["DALL-E", "Stable Diffusion", "ComfyUI", "Photoshop"],
    aiModels: ["DALL-E 3", "SDXL"],
    contentTypes: ["Image", "AI Image Generation"],
    portfolio: [
      {
        title: "Sneaker Ghost Studio",
        description: "Accurate product stills on infinite cyclorama with material close-ups.",
        mediaUrl: imgs.sneakerStudio,
        thumbnailUrl: imgs.sneakerStudio,
        contentType: "AI Image Generation",
        toolsUsed: ["Stable Diffusion", "ComfyUI"],
        aiModelsUsed: ["SDXL"],
        skills: ["Product Visualization", "Retouching"],
        aspectRatio: "1:1",
        commercialUse: true,
        date: "2026-03-08",
        category: "Product Advertisement",
        workflow: "Mask, ControlNet, retouch.",
      },
      {
        title: "Device Prism",
        description: "Hero stills for a consumer electronics drop.",
        mediaUrl: imgs.product,
        thumbnailUrl: imgs.product,
        contentType: "AI Image Generation",
        toolsUsed: ["DALL-E", "Photoshop"],
        aiModelsUsed: ["DALL-E 3"],
        skills: ["Paid Social Crops"],
        aspectRatio: "4:5",
        commercialUse: true,
        date: "2025-11-11",
        category: "Product Advertisement",
        workflow: "Angle set, lighting variants.",
      },
    ],
  },
  {
    name: "Harper Quinn",
    email: "harper@creatorhub.ai",
    headline: "UGC-native AI creators for performance ads",
    bio: "I make generative UGC that still feels human: talking-head adjacent, product-in-hand, hook-first scripts for Meta and TikTok.",
    location: "Austin, USA",
    avatarUrl: avatars.harper,
    experience: "3 years performance creative",
    experienceYears: 3,
    commercialUse: true,
    commercialNotes: "No real-person clones. Stylized presenters only. Ads are commercially licensed.",
    workflow: "Hook library → ChatGPT variants → Midjourney presenters → Runway lip-sync-safe B-roll.",
    skills: ["Performance Creative", "UGC Direction", "Copywriting", "Short-form Video"],
    specializations: ["Social Media Content", "Marketing Content", "Product Advertisement"],
    tools: ["ChatGPT", "Midjourney", "Runway", "CapCut"],
    aiModels: ["GPT-4o", "Runway Gen-3"],
    contentTypes: ["Social", "AI Video", "Image"],
    portfolio: [
      {
        title: "Hook Farm — 12 UGC Ads",
        description: "Performance ad set for a wellness SKU with generative presenters.",
        mediaUrl: imgs.social,
        thumbnailUrl: imgs.social,
        contentType: "AI Video",
        toolsUsed: ["ChatGPT", "Runway"],
        aiModelsUsed: ["GPT-4o"],
        skills: ["Performance Creative", "UGC Direction"],
        aspectRatio: "9:16",
        commercialUse: true,
        date: "2026-04-28",
        category: "Social Media Content",
        workflow: "Hooks, variants, cutdowns.",
      },
      {
        title: "Unbox Still Set",
        description: "Lifestyle stills that pair with UGC video.",
        mediaUrl: imgs.product,
        thumbnailUrl: imgs.product,
        contentType: "Image",
        toolsUsed: ["Midjourney"],
        aiModelsUsed: ["Midjourney v6"],
        skills: ["Copywriting"],
        aspectRatio: "4:5",
        commercialUse: true,
        date: "2026-02-17",
        category: "Marketing Content",
        workflow: "Prompted hands + product composite.",
      },
    ],
  },
];

async function main() {
  await prisma.engagement.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  const createdCreators = [];
  for (const c of creators) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        password: hash,
        role: Role.CREATOR,
        phone: `+1415555010${createdCreators.length}`,
        phoneVerified: true,
        creatorProfile: {
          create: {
            headline: c.headline,
            bio: c.bio,
            location: c.location,
            avatarUrl: c.avatarUrl,
            experience: c.experience,
            experienceYears: c.experienceYears,
            commercialUse: c.commercialUse,
            commercialNotes: c.commercialNotes,
            workflow: c.workflow,
            skills: c.skills,
            specializations: c.specializations,
            tools: c.tools,
            aiModels: c.aiModels,
            contentTypes: c.contentTypes,
            education: "B.Des in Digital Media & Computational Arts",
            certificates: [
              "Runway Certified AI Filmmaker (Gen-3 Alpha)",
              "Adobe Firefly Generative AI Professional",
              "Midjourney Advanced Look Development",
            ],
            resumeUrl: "https://example.com/resume.pdf",
            availability: "Available for Q4 campaigns & selective retainer projects",
            portfolio: {
              create: c.portfolio.map((p, idx) => ({
                ...p,
                date: new Date(p.date),
                isFeatured: idx < 2,
                featuredOrder: idx < 2 ? idx + 1 : 0,
              })),
            },
          },
        },
      },
      include: { creatorProfile: { include: { portfolio: true } } },
    });
    const profile = user.creatorProfile!;
    const signals = computeTrustSignals({
      bio: profile.bio,
      location: profile.location,
      experience: profile.experience,
      avatarUrl: profile.avatarUrl,
      specializations: profile.specializations,
      skills: profile.skills,
      tools: profile.tools,
      aiModels: profile.aiModels,
      workflow: profile.workflow,
      commercialUse: profile.commercialUse,
      commercialNotes: profile.commercialNotes,
      portfolioCount: profile.portfolio.length,
      completePortfolioCount: profile.portfolio.length,
    });
    await prisma.creatorProfile.update({ where: { id: profile.id }, data: { trustScore: signals.score } });
    await prisma.verification.create({
      data: {
        creatorId: profile.id,
        toolsVerified: signals.toolsVerified,
        portfolioAdded: signals.portfolioAdded,
        workflowDocumented: signals.workflowDocumented,
        previousWork: signals.previousWork,
        commercialUseInfo: signals.commercialUseInfo,
        score: signals.score,
      },
    });
    createdCreators.push({ user, profile: { ...profile, trustScore: signals.score } });
  }

  const brands = [
    {
      name: "Avery Cole",
      email: "apex@creatorhub.ai",
      companyName: "Apex Athletics",
      industry: "Footwear",
      website: "https://apex.example",
      about: "Premium performance sneakers.",
    },
    {
      name: "Mina Cho",
      email: "lumen@creatorhub.ai",
      companyName: "Lumen Beauty",
      industry: "Beauty",
      website: "https://lumen.example",
      about: "Clinical-luxury skincare.",
    },
    {
      name: "Jonah Reid",
      email: "northstar@creatorhub.ai",
      companyName: "Northstar Agency",
      industry: "Creative Agency",
      website: "https://northstar.example",
      about: "Independent brand studio.",
    },
  ];

  const createdBrands = [];
  for (const b of brands) {
    const user = await prisma.user.create({
      data: {
        name: b.name,
        email: b.email,
        password: hash,
        role: Role.BRAND,
        phone: `+1415555020${createdBrands.length}`,
        phoneVerified: true,
        brandProfile: {
          create: {
            companyName: b.companyName,
            industry: b.industry,
            website: b.website,
            about: b.about,
            logoUrl: imgs.brand,
          },
        },
      },
      include: { brandProfile: true },
    });
    createdBrands.push(user);
  }

  const apex = createdBrands[0].brandProfile!;
  const lumen = createdBrands[1].brandProfile!;
  const north = createdBrands[2].brandProfile!;

  const briefs = await prisma.$transaction([
    prisma.brief.create({
      data: {
        brandId: apex.id,
        title: "Premium Sneaker Launch",
        description:
          "I need a 30-second cinematic AI advertisement for a premium sneaker brand. Night city, material close-ups, commercial use for Instagram.",
        contentType: "AI Product Video",
        style: "Cinematic",
        targetAudience: "18-34 fashion-forward athletes",
        platform: "Instagram",
        aspectRatio: "9:16",
        duration: "30 seconds",
        requiredTools: ["Runway", "Sora"],
        requiredSkills: ["AI Video Direction", "Product Cinematography"],
        commercialUse: true,
        deadline: new Date("2026-11-15"),
        budget: "$8,000 – $12,000",
        deliverables: ["Master 30s", "9:16 crop", "3 stills"],
        creativeDirection: "Wet asphalt, sculptural lighting, premium materials.",
      },
    }),
    prisma.brief.create({
      data: {
        brandId: apex.id,
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
        budget: "$3,000 / month",
        deliverables: ["12 ads / month"],
        creativeDirection: "Hook-first, product-in-hand.",
      },
    }),
    prisma.brief.create({
      data: {
        brandId: lumen.id,
        title: "Serum Texture Film",
        description: "Macro AI beauty film emphasizing texture and light.",
        contentType: "AI Video",
        style: "Editorial luxury",
        targetAudience: "Clinical-luxury shoppers",
        platform: "YouTube",
        aspectRatio: "16:9",
        duration: "20 seconds",
        requiredTools: ["Runway", "Midjourney"],
        requiredSkills: ["Product Cinematography"],
        commercialUse: true,
        budget: "$6,500",
        deliverables: ["Hero film", "stills"],
        creativeDirection: "Glass, water, skin-safe generative.",
      },
    }),
    prisma.brief.create({
      data: {
        brandId: north.id,
        title: "Agency Showreel World",
        description: "A branded motion world for Northstar's site hero.",
        contentType: "Motion Graphics",
        style: "Kinetic",
        targetAudience: "CMOs",
        platform: "Web",
        aspectRatio: "16:9",
        duration: "12 seconds",
        requiredTools: ["Runway", "Adobe Firefly"],
        requiredSkills: ["Motion Graphics", "AI Branding"],
        commercialUse: true,
        budget: "$9,000",
        deliverables: ["Looping hero", "still frames"],
        creativeDirection: "Architectural, luminous, restrained type.",
      },
    }),
    prisma.brief.create({
      data: {
        brandId: lumen.id,
        title: "Campaign Still Library",
        description: "Photoreal stills for paid and OOH.",
        contentType: "AI Image Generation",
        style: "Photoreal editorial",
        targetAudience: "Beauty editors",
        platform: "Print + Social",
        aspectRatio: "4:5",
        duration: "Still",
        requiredTools: ["Midjourney", "ComfyUI"],
        requiredSkills: ["Generative Imaging"],
        commercialUse: true,
        budget: "$4,200",
        deliverables: ["20 stills"],
        creativeDirection: "Soft north light, no celebrity likeness.",
      },
    }),
  ]);

  await prisma.shortlist.createMany({
    data: [
      { brandId: apex.id, creatorId: createdCreators[0].profile.id },
      { brandId: apex.id, creatorId: createdCreators[1].profile.id },
      { brandId: lumen.id, creatorId: createdCreators[3].profile.id },
    ],
  });

  await prisma.engagement.createMany({
    data: [
      {
        brandId: lumen.id,
        creatorId: createdCreators[3].profile.id,
        briefId: briefs[4].id,
        status: EngagementStatus.IN_PROGRESS,
        message: "Excited to build the still library.",
      },
      {
        brandId: north.id,
        creatorId: createdCreators[2].profile.id,
        briefId: briefs[3].id,
        status: EngagementStatus.PENDING,
        message: "Can you own the hero world?",
      },
    ],
  });

  console.log("Seeded CreatorHub AI demo data.");
  console.log("Brand login:  apex@creatorhub.ai / DemoPass123!");
  console.log("Creator login: maya@creatorhub.ai / DemoPass123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
