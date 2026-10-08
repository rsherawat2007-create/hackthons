import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { Engagement, EngagementStatus } from "@/types";

const STATUS_COLORS: Record<EngagementStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-red-50 text-red-600",
  IN_PROGRESS: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

export function EngagementsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const d = await api<{ engagements: Engagement[] }>("/api/engagements");
      setItems(d.engagements);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load engagements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: EngagementStatus) {
    try {
      await api(`/api/engagements/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(`Status updated to ${status.toLowerCase().replace("_", " ")}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-5xl">Engagements</h1>
      <p className="mt-2 text-ink/60">
        {user?.role === "BRAND"
          ? "Briefs you've sent to creators."
          : "Briefs brands have sent you."}
      </p>

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-violet-50" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <Card className="p-10 text-center text-ink/50">
            No engagements yet.
            {user?.role === "BRAND" && (
              <p className="mt-2 text-sm">
                <Link to="/creators" className="text-accent underline">
                  Find creators
                </Link>{" "}
                and send a brief to get started.
              </p>
            )}
          </Card>
        )}

        {items.map((e) => (
          <Card key={e.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {/* Brief title links to brief detail for brands */}
                {user?.role === "BRAND" ? (
                  <Link
                    to={`/briefs/${e.brief.id}`}
                    className="font-semibold hover:text-accent"
                  >
                    {e.brief.title}
                  </Link>
                ) : (
                  <p className="font-semibold">{e.brief.title}</p>
                )}
                <p className="text-sm text-ink/60">
                  {e.brand.companyName} → {e.creator.user.name}
                </p>
                {e.message && (
                  <p className="mt-1 text-sm italic text-ink/50">"{e.message}"</p>
                )}
                <p className="mt-1 text-xs text-ink/40">
                  {e.brief.contentType} · {e.brief.platform}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  STATUS_COLORS[e.status] ?? "bg-violet-50 text-violet-700"
                }`}
              >
                {e.status.replace("_", " ")}
              </span>
            </div>

            {/* Creator actions */}
            {user?.role === "CREATOR" && e.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="accent" onClick={() => setStatus(e.id, "ACCEPTED")}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(e.id, "REJECTED")}>
                  Decline
                </Button>
              </div>
            )}
            {user?.role === "CREATOR" && e.status === "ACCEPTED" && (
              <Button size="sm" className="mt-3" onClick={() => setStatus(e.id, "IN_PROGRESS")}>
                Mark in progress
              </Button>
            )}
            {user?.role === "CREATOR" && e.status === "IN_PROGRESS" && (
              <Button size="sm" className="mt-3" onClick={() => setStatus(e.id, "COMPLETED")}>
                Mark completed
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
