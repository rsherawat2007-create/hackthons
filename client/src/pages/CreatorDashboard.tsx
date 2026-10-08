import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrustSignals } from "@/components/TrustSignals";
import { api } from "@/services/api";
import type { Engagement, Creator } from "@/types";

export function CreatorDashboard() {
  const [data, setData] = useState<{
    profile: Creator;
    stats: { requests: number; active: number; completed: number; trustScore: number };
    engagements: Engagement[];
  } | null>(null);

  async function load() {
    const d = await api<NonNullable<typeof data>>("/api/dashboard/creator");
    setData(d);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    try {
      await api(`/api/engagements/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(`Marked ${status.toLowerCase()}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (!data) return <div className="p-10 text-center">Loading dashboard…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-5xl">Creator studio</h1>
          <p className="text-ink/60">{data.profile.headline}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/creator/profile">Edit profile</Link>
          </Button>
          <Button variant="accent" asChild>
            <Link to="/creator/portfolio">Portfolio</Link>
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["Incoming", data.stats.requests],
          ["Active", data.stats.active],
          ["Completed", data.stats.completed],
          ["Trust score", data.stats.trustScore],
        ].map(([l, v]) => (
          <Card key={String(l)} className="p-5">
            <p className="text-xs uppercase tracking-widest text-ink/40">{l}</p>
            <p className="font-display text-4xl">{v}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="p-5">
          <h2 className="font-semibold">Engagement requests</h2>
          <div className="mt-3 space-y-3">
            {data.engagements.length === 0 && <p className="text-sm text-ink/50">No briefs yet. Complete your profile to get discovered.</p>}
            {data.engagements.map((e) => (
              <div key={e.id} className="rounded-2xl bg-mist p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{e.brief.title}</p>
                  <span className="text-xs uppercase">{e.status}</span>
                </div>
                <p className="text-sm text-ink/60">From {e.brand.companyName}</p>
                {e.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="accent" onClick={() => setStatus(e.id, "ACCEPTED")}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(e.id, "REJECTED")}>
                      Reject
                    </Button>
                  </div>
                )}
                {e.status === "ACCEPTED" && (
                  <Button size="sm" className="mt-3" onClick={() => setStatus(e.id, "IN_PROGRESS")}>
                    Start project
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <TrustSignals verification={data.profile.verification} trustScore={data.stats.trustScore} creator={data.profile} />
        </Card>
      </div>
    </div>
  );
}
