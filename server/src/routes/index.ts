import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import * as auth from "../controllers/authController.js";
import * as phoneAuth from "../controllers/phoneAuthController.js";
import * as credentials from "../controllers/credentialsController.js";
import * as creators from "../controllers/creatorController.js";
import * as portfolio from "../controllers/portfolioController.js";
import * as briefs from "../controllers/briefController.js";
import * as shortlist from "../controllers/shortlistController.js";
import * as engagements from "../controllers/engagementController.js";
import * as dashboard from "../controllers/dashboardController.js";
import * as billing from "../controllers/billingController.js";
import { aiService } from "../ai/aiService.js";

export const router = Router();

router.post("/auth/register", asyncHandler(auth.register));
router.post("/auth/login", asyncHandler(auth.login));
router.get("/auth/me", requireAuth, asyncHandler(auth.me));

// Phone verification routes
router.post("/auth/phone/send-otp", requireAuth, asyncHandler(phoneAuth.sendOtp));
router.post("/auth/phone/verify-otp", requireAuth, asyncHandler(phoneAuth.verifyOtp));
router.get("/auth/phone/status", requireAuth, asyncHandler(phoneAuth.getPhoneStatus));

// Secure File streaming (Resume / Certificate attachments)
router.get("/files/:fileId", optionalAuth, asyncHandler(credentials.serveFile));

// Resume management
router.post("/creators/resume", requireAuth, requireRole("CREATOR"), asyncHandler(credentials.uploadResume));
router.delete("/creators/resume", requireAuth, requireRole("CREATOR"), asyncHandler(credentials.deleteResume));
router.put("/creators/resume/visibility", requireAuth, requireRole("CREATOR"), asyncHandler(credentials.toggleResumeVisibility));

// Certificate management
router.get("/creators/:creatorId/certificates", optionalAuth, asyncHandler(credentials.listCertificates));
router.post("/creators/certificates", requireAuth, requireRole("CREATOR"), asyncHandler(credentials.addCertificate));
router.delete("/creators/certificates/:id", requireAuth, requireRole("CREATOR"), asyncHandler(credentials.deleteCertificate));

router.get("/creators/filters", optionalAuth, asyncHandler(creators.getCreatorFilters));
router.post("/creators/parse-search", optionalAuth, asyncHandler(creators.parseNlSearch));
router.get("/creators/parse-search", optionalAuth, asyncHandler(creators.parseNlSearch));
router.get("/creators/search", optionalAuth, asyncHandler(creators.listCreators));
router.get("/creators/compare", optionalAuth, asyncHandler(creators.compareCreators));
router.get("/creators", optionalAuth, asyncHandler(creators.listCreators));
router.get("/creators/:id", optionalAuth, asyncHandler(creators.getCreator));
router.post("/creators/profile", requireAuth, requireRole("CREATOR"), asyncHandler(creators.upsertMyProfile));
router.put("/creators/profile", requireAuth, requireRole("CREATOR"), asyncHandler(creators.upsertMyProfile));
router.post("/matching", optionalAuth, asyncHandler(creators.matchCreators));
router.post("/ai/assistant", optionalAuth, asyncHandler(creators.chatWithCreatorHubAi));
router.post("/creators/ai-assistant", optionalAuth, asyncHandler(creators.chatWithCreatorHubAi));

router.get("/portfolio/item/:id", asyncHandler(portfolio.getPortfolioItem));
router.get("/portfolio/:creatorId", asyncHandler(portfolio.listPortfolio));
router.post("/portfolio", requireAuth, requireRole("CREATOR"), asyncHandler(portfolio.createPortfolio));
router.put("/portfolio/reorder-featured", requireAuth, requireRole("CREATOR"), asyncHandler(portfolio.reorderFeatured));
router.put("/portfolio/:id/feature", requireAuth, requireRole("CREATOR"), asyncHandler(portfolio.toggleFeature));
router.put("/portfolio/:id", requireAuth, requireRole("CREATOR"), asyncHandler(portfolio.updatePortfolio));
router.delete("/portfolio/:id", requireAuth, requireRole("CREATOR"), asyncHandler(portfolio.deletePortfolio));

router.get("/briefs", requireAuth, requireRole("BRAND"), asyncHandler(briefs.listBriefs));
router.post("/briefs", requireAuth, requireRole("BRAND"), asyncHandler(briefs.createBrief));
router.get("/briefs/:id", requireAuth, asyncHandler(briefs.getBrief));
router.put("/briefs/:id", requireAuth, requireRole("BRAND"), asyncHandler(briefs.updateBrief));
router.delete("/briefs/:id", requireAuth, requireRole("BRAND"), asyncHandler(briefs.deleteBrief));
router.get("/briefs/:id/matches", requireAuth, asyncHandler(briefs.getBriefMatches));
router.post("/ai/generate-brief", requireAuth, asyncHandler(briefs.generateBrief));
router.get("/ai/status", optionalAuth, (req, res) => {
  res.json({
    status: "ok",
    provider: aiService.getProviderName(),
    hasApiKey: aiService.isProviderAvailable(),
    capabilities: [
      "natural-language-creator-search",
      "ai-assisted-creative-brief-generation",
      "structured-json-output",
      "deterministic-fallback",
    ],
  });
});

router.get("/shortlist", requireAuth, requireRole("BRAND"), asyncHandler(shortlist.listShortlist));
router.post("/shortlist", requireAuth, requireRole("BRAND"), asyncHandler(shortlist.addShortlist));
router.delete("/shortlist/:creatorId", requireAuth, requireRole("BRAND"), asyncHandler(shortlist.removeShortlist));

router.get("/engagements", requireAuth, asyncHandler(engagements.listEngagements));
router.post("/engagements", requireAuth, requireRole("BRAND"), asyncHandler(engagements.createEngagement));
router.put("/engagements/:id", requireAuth, asyncHandler(engagements.updateEngagement));

router.get("/billing/usage", optionalAuth, asyncHandler(billing.getUsage));
router.get("/billing/plans", optionalAuth, asyncHandler(billing.getPlans));
router.post("/billing/upgrade", requireAuth, requireRole("BRAND"), asyncHandler(billing.upgradePlan));

router.get("/dashboard/brand", requireAuth, requireRole("BRAND"), asyncHandler(dashboard.brandDashboard));
router.get("/dashboard/creator", requireAuth, requireRole("CREATOR"), asyncHandler(dashboard.creatorDashboard));
