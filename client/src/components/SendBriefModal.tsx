import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Zap, Clock, AlertCircle, ArrowRight, ShieldCheck, Compass } from "lucide-react";
import { api } from "@/services/api";
import { useBilling } from "@/context/BillingContext";
import type { Brief } from "@/types";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";

export function SendBriefModal({
  open,
  onClose,
  creatorId,
  creatorName,
}: {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
}) {
  const { usage, openUpgradeModal, refetchUsage } = useBilling();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [briefId, setBriefId] = useState("");
  const [message, setMessage] = useState("We'd love to collaborate on this campaign.");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    api<{ briefs: Brief[] }>("/api/briefs")
      .then((d) => {
        setBriefs(d.briefs);
        setBriefId(d.briefs[0]?.id || "");
      })
      .catch(() => setBriefs([]));
  }, [open]);

  async function send() {
    if (usage.isLimitReached) {
      onClose();
      openUpgradeModal();
      return;
    }

    if (!briefId) {
      toast.error("Create a brief first");
      return;
    }

    setSending(true);
    try {
      await api("/api/engagements", {
        method: "POST",
        body: JSON.stringify({ creatorId, briefId, message }),
      });
      await refetchUsage();
      toast.success(`Brief sent to ${creatorName}`);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send brief";
      if (msg.includes("limit")) {
        onClose();
        openUpgradeModal();
      } else {
        toast.error(msg);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Send brief to ${creatorName}`}>
      {/* ── Brand Usage Banner ────────────────────────────────────────── */}
      <div className="mb-4 rounded-xl border border-ink/10 bg-mist/40 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span>Brand Engagements:</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              usage.isLimitReached
                ? "bg-rose-100 text-rose-800 border border-rose-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            {usage.displayStatus}
          </span>
        </div>
      </div>

      {/* ── Limit Reached State ───────────────────────────────────────── */}
      {usage.isLimitReached ? (
        <div className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-rose-950">
              Free Engagement Limit Reached (0 remaining)
            </h4>
            <p className="mt-1 text-xs text-rose-800">
              You have completed all 3 free creator engagements. Upgrade your brand plan to send new briefs and initiate collaborations.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="accent"
              className="w-full font-bold text-xs h-10 shadow-xs"
              onClick={() => {
                onClose();
                openUpgradeModal();
              }}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              View Upgrade Plans
            </Button>
          </div>

          <p className="text-[11px] text-ink/50 pt-1">
            Creator discovery, map search, and profile views remain 100% free and unblocked.
          </p>
        </div>
      ) : briefs.length === 0 ? (
        <div className="space-y-3 py-2">
          <p className="text-sm text-ink/60">
            You have no creative briefs yet. Create one in the AI Brief Builder first to connect requirements with this creator.
          </p>
          <Button variant="accent" asChild className="w-full text-xs">
            <a href="/ai-brief-builder">Create a Brief Now</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink">Select Brief</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-xs focus:border-accent focus:outline-none"
              value={briefId}
              onChange={(e) => setBriefId(e.target.value)}
            >
              {briefs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink">Message to Creator</label>
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-ink/10 p-3 text-xs focus:border-accent focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce your project, timeline, and expectations…"
            />
          </div>

          <Button
            variant="accent"
            className="w-full font-bold text-xs h-10 shadow-xs"
            disabled={sending}
            onClick={send}
          >
            {sending ? "Sending Brief…" : `Send Brief (Uses 1 Engagement · ${usage.displayStatus})`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
