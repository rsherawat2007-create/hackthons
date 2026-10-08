import { useState } from "react";
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  Clock,
  Compass,
} from "lucide-react";
import { useBilling, type SubscriptionTier } from "@/context/BillingContext";
import { Button } from "@/components/ui/button";

export function UpgradeModal() {
  const { usage, plans, upgradeModalOpen, setUpgradeModalOpen, upgradePlan } = useBilling();
  const [upgradingTier, setUpgradingTier] = useState<SubscriptionTier | null>(null);

  if (!upgradeModalOpen) return null;

  async function handleUpgrade(tier: SubscriptionTier) {
    setUpgradingTier(tier);
    try {
      await upgradePlan(tier);
    } finally {
      setUpgradingTier(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setUpgradeModalOpen(false)}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-ink/40 transition hover:bg-mist hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Brand Engagement Limits & Upgrades
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Upgrade Your Brand Plan
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-ink/65">
            Connect with top verified AI creators, scale production briefs, and access protected commercial licenses.
          </p>
        </div>

        {/* Current Usage Status Banner */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-ink">
                    Current Usage Status
                  </h4>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      usage.isLimitReached
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {usage.displayStatus}
                  </span>
                </div>
                <p className="text-xs text-ink/70 mt-0.5">
                  {usage.isLimitReached
                    ? "You have reached your 3 free creator engagements limit. Upgrade your plan below to send briefs and initiate new collaborations."
                    : `You have used ${usage.engagementsUsed} of ${usage.engagementsLimit} free engagements (${usage.displayStatus}).`}
                </p>
              </div>
            </div>

            {/* Non-blocking reassurance */}
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[11px] font-semibold text-ink/75 border border-ink/8 shadow-2xs">
              <Compass className="h-3.5 w-3.5 text-accent" />
              <span>Discovery & Profiles are 100% Free</span>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {/* 1. Free Trial */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-mist/30 p-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-ink">Free Trial</h3>
                {usage.tier === "FREE" && (
                  <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink/60">3 free creator engagements</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-ink">$0</span>
                <span className="text-xs text-ink/50">/ month</span>
              </div>

              <ul className="mt-4 space-y-2 border-t border-ink/8 pt-4 text-xs text-ink/75">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>3 free creator engagements</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Full creator search & map discovery</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Side-by-side creator comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>AI creative brief builder</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                disabled
                className="w-full text-xs font-semibold h-9"
              >
                {usage.tier === "FREE" ? "Active Plan" : "Downgrade"}
              </Button>
            </div>
          </div>

          {/* 2. Growth Tier ($49/mo) */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-accent bg-accent/5 p-5 shadow-sm">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
              Most Popular
            </span>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-ink">Growth</h3>
                {usage.tier === "STARTER" && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink/60">25 creator engagements / mo</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-ink">$49</span>
                <span className="text-xs text-ink/50">/ month</span>
              </div>

              <ul className="mt-4 space-y-2 border-t border-accent/15 pt-4 text-xs text-ink/85">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0 font-bold" />
                  <span className="font-semibold">25 creator engagements/mo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0 font-bold" />
                  <span>Priority creator response queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0 font-bold" />
                  <span>Commercial rights cleared certificates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0 font-bold" />
                  <span>Team shortlist collaboration</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <Button
                variant="accent"
                disabled={usage.tier === "STARTER" || upgradingTier === "STARTER"}
                onClick={() => handleUpgrade("STARTER")}
                className="w-full text-xs font-bold h-9 shadow-xs"
              >
                {usage.tier === "STARTER"
                  ? "Current Plan"
                  : upgradingTier === "STARTER"
                  ? "Upgrading…"
                  : "Upgrade to Growth"}
              </Button>
            </div>
          </div>

          {/* 3. Scale Pro ($149/mo) */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-ink">Scale Pro</h3>
                {usage.tier === "PRO" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink/60">100 engagements / mo</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-ink">$149</span>
                <span className="text-xs text-ink/50">/ month</span>
              </div>

              <ul className="mt-4 space-y-2 border-t border-ink/8 pt-4 text-xs text-ink/75">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">100 creator engagements/mo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>CreatorHub AI priority matchmaking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Verified contract & license escrow</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Dedicated creative producer support</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                disabled={usage.tier === "PRO" || upgradingTier === "PRO"}
                onClick={() => handleUpgrade("PRO")}
                className="w-full text-xs font-semibold h-9"
              >
                {usage.tier === "PRO"
                  ? "Current Plan"
                  : upgradingTier === "PRO"
                  ? "Upgrading…"
                  : "Upgrade to Pro"}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Architecture note */}
        <div className="mt-6 border-t border-ink/8 pt-4 text-center">
          <p className="text-[11px] text-ink/50">
            Payment Provider Abstraction: Prepared for Stripe & Merchant integration. Upgrades simulate instant authorization in sandbox.
          </p>
        </div>
      </div>
    </div>
  );
}
