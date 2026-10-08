import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { Creator } from "@/types";

interface CompareContextType {
  compareList: Creator[];
  addToCompare: (creator: Creator) => boolean;
  removeFromCompare: (creatorId: string) => void;
  toggleCompare: (creator: Creator) => void;
  isInCompare: (creatorId: string) => boolean;
  clearCompare: () => void;
  compareCount: number;
  maxSlots: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = "creatorhub_compare_creators_v1";
const MAX_SLOTS = 3;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Creator[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_SLOTS);
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
    } catch {
      // ignore
    }
  }, [compareList]);

  const isInCompare = useCallback(
    (creatorId: string) => {
      return compareList.some((c) => c.id === creatorId || c.user?.id === creatorId);
    },
    [compareList]
  );

  const addToCompare = useCallback(
    (creator: Creator) => {
      if (isInCompare(creator.id)) {
        toast.info(`${creator.user.name} is already in comparison`);
        return false;
      }

      if (compareList.length >= MAX_SLOTS) {
        toast.error(`You can compare up to ${MAX_SLOTS} creators at a time. Remove one first.`);
        return false;
      }

      const updated = [...compareList, creator];
      setCompareList(updated);
      toast.success(
        `Added ${creator.user.name} to comparison (${updated.length}/${MAX_SLOTS})`
      );
      return true;
    },
    [compareList, isInCompare]
  );

  const removeFromCompare = useCallback((creatorId: string) => {
    setCompareList((prev) => {
      const found = prev.find((c) => c.id === creatorId || c.user?.id === creatorId);
      const filtered = prev.filter((c) => c.id !== creatorId && c.user?.id !== creatorId);
      if (found) {
        toast.info(`Removed ${found.user.name} from comparison`);
      }
      return filtered;
    });
  }, []);

  const toggleCompare = useCallback(
    (creator: Creator) => {
      if (isInCompare(creator.id)) {
        removeFromCompare(creator.id);
      } else {
        addToCompare(creator);
      }
    },
    [isInCompare, removeFromCompare, addToCompare]
  );

  const clearCompare = useCallback(() => {
    setCompareList([]);
    toast.info("Comparison list cleared");
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        isInCompare,
        clearCompare,
        compareCount: compareList.length,
        maxSlots: MAX_SLOTS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
