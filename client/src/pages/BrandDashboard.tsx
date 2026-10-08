import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreatorCard } from "@/components/CreatorCard";
import { api } from "@/services/api";
import type { Brief, Creator, Engagement } from "@/types";

type Dash = {
  stats: { activeBriefs: number; shortlisted: number; contacted: number; projects: number };
  briefs: Brief[];
  shortlists: Array<{ creator: Creator }>;
  engagements: Engagement[];
  searches: Array<{ query: string; createdAt: string }>;
  recommended: Creator[];
};

export function BrandDashboard() {
  const [data, setData] = useState<Dash | null>(null);
  useEffect(() => {
    api<Dash>("/api/dashboard/brand").then(setData);
  }, []);
  if (!data) return <div className="p-10 text-center">Loading dashboard…</div>;

  const cards = [
    ["Active Briefs", data.stats.activeBriefs],
    ["Shortlisted", data.stats.shortlisted],
    ["Creators Contacted", data.stats.contacted],
    ["Projects", data.stats.projects],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-5xl">Brand studio</h1>
          <p className="text-ink/60">Briefs, matches, and engagements in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/ai-brief-builder">AI Brief Builder</Link>
          </Button>
          <Button variant="accent" asChild>
            <Link to="/creators">Find creators</Link>
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-xs uppercase tracking-widest text-ink/40">{label}</p>
            <p className="font-display text-4xl">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Active briefs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.briefs.map((b) => (
              <li key={b.id} className="rounded-xl bg-mist px-3 py-2">
                <Link to={`/briefs/${b.id}`} className="font-medium">
                  {b.title}
                </Link>
                <p className="text-ink/50">
                  {b.contentType} · {b.platform}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Recent searches</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/70">
            {data.searches.length ? data.searches.map((s) => <li key={s.createdAt}>{s.query || "Filtered browse"}</li>) : <li>No searches yet</li>}
          </ul>
        </Card>
      </div>
      <h2 className="mt-10 font-display text-3xl">Recommended creators</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {data.recommended.map((c) => (
          <CreatorCard key={c.id} creator={c} />
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link to="/shortlist">View shortlist</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/engagements">Engagements</Link>
        </Button>
      </div>
    </div>
  );
}
