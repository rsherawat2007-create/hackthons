import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Check,
  Zap,
  Clock,
  Compass,
  ArrowLeft,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { useBilling, type SubscriptionTier } from "@/context/BillingContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PricingPage() {
  const { usage, plans, upgradePlan } = useBilling();
  const [upgradingTier, setUpgradingTier] = useState<SubscriptionTier | null>(null);

  async function handleUpgrade(tier: SubscriptionTier) {
    setUpgradingTier(tier);
    try {
      await upgradePlan(tier);
    } finally {
      setUpgradingTier(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/creators"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Creator Discovery
        </Link>
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent">
          <Zap className="h-3.5 w-3.5 text-accent" />
          Transparent Brand Pricing
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Engage Verified AI Creators
        </h1>
        <p className="mt-2 text-sm sm:text-base text-ink/65">
          Every brand starts with 3 free creator engagements. Upgrade anytime to scale your content production.
        </p>
      </div>

      {/* Current Usage Status Banner */}
      <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 shadow-2xs">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-ink">
                  Your Current Usage Status
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    usage.isLimitReached
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {usage.displayStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink/70 mt-1">
                {usage.isLimitReached
                  ? "You have reached your 3 free creator engagements limit. Upgrade your brand plan to send briefs and initiate new projects."
                  : `You have used ${usage.engagementsUsed} of ${usage.engagementsLimit} free engagements (${usage.displayStatus}).`}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-xs font-semibold text-ink/80 border border-ink/10 shadow-2xs">
            <Compass className="h-4 w-4 text-accent" />
            <span>Search & Profiles: 100% Free</span>
          </div>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {/* Free Plan */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink">Free Trial</h3>
              {usage.tier === "FREE" && (
                <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-[10px] font-bold text-ink">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/60">3 free creator engagements</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-ink">$0</span>
              <span className="text-xs text-ink/50">/ month</span>
            </div>

            <ul className="mt-6 space-y-3 border-t border-ink/8 pt-5 text-xs text-ink/75">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>3 free creator engagements</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Full creator search & map discovery</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Side-by-side creator comparison</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>AI creative brief builder</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Button variant="outline" disabled className="w-full text-xs font-semibold">
              {usage.tier === "FREE" ? "Active Plan" : "Free Plan"}
            </Button>
          </div>
        </Card>

        {/* Growth Plan */}
        <Card className="relative flex flex-col justify-between p-6 border-2 border-accent bg-accent/5 shadow-md">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            Most Popular
          </span>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink">Growth</h3>
              {usage.tier === "STARTER" && (
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/60">25 engagements / month</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-ink">$49</span>
              <span className="text-xs text-ink/50">/ month</span>
            </div>

            <ul className="mt-6 space-y-3 border-t border-accent/15 pt-5 text-xs text-ink/85">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-accent shrink-0 font-bold" />
                <span className="font-bold">25 creator engagements/mo</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-accent shrink-0 font-bold" />
                <span>Priority creator response routing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-accent shrink-0 font-bold" />
                <span>Commercial rights clearance proof</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-accent shrink-0 font-bold" />
                <span>Team shortlist collaboration</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Button
              variant="accent"
              disabled={usage.tier === "STARTER" || upgradingTier === "STARTER"}
              onClick={() => handleUpgrade("STARTER")}
              className="w-full text-xs font-bold"
            >
              {usage.tier === "STARTER"
                ? "Active Plan"
                : upgradingTier === "STARTER"
                ? "Authorizing…"
                : "Upgrade to Growth"}
            </Button>
          </div>
        </Card>

        {/* Scale Pro Plan */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink">Scale Pro</h3>
              {usage.tier === "PRO" && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Current Plan
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/60">100 engagements / month</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-ink">$149</span>
              <span className="text-xs text-ink/50">/ month</span>
            </div>

            <ul className="mt-6 space-y-3 border-t border-ink/8 pt-5 text-xs text-ink/75">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold">100 creator engagements/mo</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>CreatorHub AI priority matchmaking</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Commercial license escrow</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Dedicated production manager</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              disabled={usage.tier === "PRO" || upgradingTier === "PRO"}
              onClick={() => handleUpgrade("PRO")}
              className="w-full text-xs font-semibold"
            >
              {usage.tier === "PRO"
                ? "Active Plan"
                : upgradingTier === "PRO"
                ? "Authorizing…"
                : "Upgrade to Pro"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
