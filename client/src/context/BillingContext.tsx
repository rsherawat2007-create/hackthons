import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface PlanDetails {
  id: string;
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  engagementLimit: number;
  features: string[];
  isPopular?: boolean;
}

export interface BrandUsageStatus {
  tier: SubscriptionTier;
  planName: string;
  engagementsUsed: number;
  engagementsLimit: number;
  engagementsRemaining: number;
  displayStatus: "3 free engagements available" | "2 remaining" | "1 remaining" | "0 remaining" | string;
  isLimitReached: boolean;
  canEngage: boolean;
}

interface BillingContextType {
  usage: BrandUsageStatus;
  plans: PlanDetails[];
  loading: boolean;
  upgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
  openUpgradeModal: () => void;
  refetchUsage: () => Promise<void>;
  upgradePlan: (tier: SubscriptionTier) => Promise<boolean>;
}

const defaultUsage: BrandUsageStatus = {
  tier: "FREE",
  planName: "Free Trial",
  engagementsUsed: 0,
  engagementsLimit: 3,
  engagementsRemaining: 3,
  displayStatus: "3 free engagements available",
  isLimitReached: false,
  canEngage: true,
};

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<BrandUsageStatus>(defaultUsage);
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!user || user.role !== "BRAND") return;
    setLoading(true);
    try {
      const data = await api<{ usage: BrandUsageStatus; plans: PlanDetails[] }>("/api/billing/usage");
      if (data.usage) {
        setUsage(data.usage);
      }
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const openUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(true);
  }, []);

  const upgradePlan = useCallback(
    async (targetTier: SubscriptionTier) => {
      try {
        const res = await api<{
          success: boolean;
          checkout: { checkoutUrl: string; sessionId: string };
          usage: BrandUsageStatus;
          plan: PlanDetails;
        }>("/api/billing/upgrade", {
          method: "POST",
          body: JSON.stringify({ targetTier }),
        });

        if (res.usage) {
          setUsage(res.usage);
        }
        toast.success(`Successfully upgraded to ${res.plan.name} plan!`);
        setUpgradeModalOpen(false);
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to upgrade plan");
        return false;
      }
    },
    []
  );

  return (
    <BillingContext.Provider
      value={{
        usage,
        plans,
        loading,
        upgradeModalOpen,
        setUpgradeModalOpen,
        openUpgradeModal,
        refetchUsage: fetchUsage,
        upgradePlan,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
}
