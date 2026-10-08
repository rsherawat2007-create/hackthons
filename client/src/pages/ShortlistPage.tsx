import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreatorCard } from "@/components/CreatorCard";
import { SendBriefModal } from "@/components/SendBriefModal";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Creator } from "@/types";

export function ShortlistPage() {
  const [items, setItems] = useState<Array<{ id: string; creator: Creator }>>([]);
  const [sendTo, setSendTo] = useState<Creator | null>(null);

  async function load() {
    const d = await api<{ shortlist: Array<{ id: string; creator: Creator }> }>("/api/shortlist");
    setItems(d.shortlist);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await api(`/api/shortlist/${id}`, { method: "DELETE" });
    toast.success("Removed");
    load();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-5xl">Shortlist</h1>
      <p className="text-ink/60">Creators you want to brief next.</p>
      {items.length === 0 ? (
        <Card className="mt-6 p-10 text-center text-ink/50">Your shortlist is empty. Search creators and tap Shortlist.</Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((i) => (
            <CreatorCard
              key={i.id}
              creator={i.creator}
              shortlisted
              onShortlist={() => remove(i.creator.id)}
              onSend={() => setSendTo(i.creator)}
            />
          ))}
        </div>
      )}
      <SendBriefModal open={!!sendTo} onClose={() => setSendTo(null)} creatorId={sendTo?.id || ""} creatorName={sendTo?.user.name || ""} />
    </div>
  );
}
