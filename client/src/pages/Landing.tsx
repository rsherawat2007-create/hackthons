import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Clapperboard, Search, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreatorCard } from "@/components/CreatorCard";
import { api } from "@/services/api";
import type { Creator } from "@/types";

const categories = [
  "AI Video",
  "Product Advertisement",
  "Motion Graphics",
  "AI Branding",
  "Social Media Content",
  "Animation",
  "AI Image Generation",
  "Marketing Content",
];

export function Landing() {
  const [featured, setFeatured] = useState<Creator[]>([]);

  useEffect(() => {
    api<{ results: Creator[] }>("/api/creators?keyword=AI%20product%20video&tool=Runway&specialization=Product%20Advertisement&contentType=AI%20Video&commercialUse=true")
      .then((d) => setFeatured(d.results.slice(0, 3)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-aurora opacity-80" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:py-28">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" /> AI-native marketplace
            </p>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              Find the right AI creator for your next campaign.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Discover verified AI creators based on skills, tools, workflows, specialization, and real portfolio work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link to="/creators">
                  Find AI Creators <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" className="bg-white text-ink hover:bg-violet-100" asChild>
                <Link to="/register?role=CREATOR">Join as Creator</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/50">Discover AI creators. Build better campaigns.</p>
          </div>
          <Card className="relative overflow-hidden bg-white/10 p-5 text-white backdrop-blur-xl">
            <p className="text-xs uppercase tracking-widest text-white/60">Live match preview</p>
            <p className="mt-2 font-display text-3xl">94% · Excellent Match</p>
            <p className="mt-3 text-sm text-white/70">
              Skill 35/35 · Specialization 18/20 · Tool 15/15 · Content 12/15 · Portfolio 9/10 · Trust 5/5
            </p>
            <div className="mt-6 space-y-3">
              {["Runway + Sora product film", "Commercial-use documented", "Workflow: look-dev → motion → grade"].map((row) => (
                <div key={row} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-accent-3" /> {row}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: Wand2, title: "Shape the brief", body: "Type a rough idea. The AI Brief Builder turns it into tools, format, duration, and commercial-use requirements." },
            { icon: Search, title: "Match creators", body: "Filter by skill, tool, specialization, and content type. Scores are calculated from real profile data." },
            { icon: Clapperboard, title: "Engage & deliver", body: "Shortlist, send the brief, and move from pending to accepted, in progress, and complete." },
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <item.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-4xl">Creator categories</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c} to={`/creators?specialization=${encodeURIComponent(c)}`} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm hover:border-accent">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl">Featured creators</h2>
          <Link to="/creators" className="text-sm font-semibold text-accent">
            View marketplace
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featured.length
            ? featured.map((c) => <CreatorCard key={c.id} creator={c} />)
            : [1, 2, 3].map((i) => <Card key={i} className="h-80 animate-pulse bg-violet-50" />)}
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">Why CreatorHub AI</h2>
            <p className="mt-4 text-white/70">
              Traditional freelance marketplaces hide the production stack. Brands hiring AI-native talent need tools, models,
              workflows, and licensing in the same profile as the work.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Search by Runway, Sora, Midjourney, ComfyUI — not just “video editor”.",
              "Match scores from skills, specialization, tools, content type, portfolio, and trust.",
              "Commercial-use notes live next to the work, not in a buried FAQ.",
            ].map((t) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Card className="grid gap-6 p-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">AI Brief Builder</h2>
            <p className="mt-3 text-ink/60">
              “I need a 30 second Instagram advertisement for my new sneaker brand.” becomes a structured brief with format,
              tools, and deliverables.
            </p>
            <Button className="mt-6" variant="accent" asChild>
              <Link to="/ai-brief-builder">Open Brief Builder</Link>
            </Button>
          </div>
          <div className="rounded-2xl bg-mist p-5 font-mono text-xs leading-6 text-ink/70">
            {`{ campaignTitle: "Premium Sneaker Launch",
  contentType: "AI Product Video",
  style: "Cinematic",
  platform: "Instagram",
  aspectRatio: "9:16",
  commercialUse: true }`}
          </div>
        </Card>
      </section>

      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-4xl">Verification system</h2>
          <p className="mt-3 max-w-2xl text-ink/60">
            Trust Score is computed from profile completeness, portfolio, tools, workflow, and commercial-use information. It
            is a platform signal — not an external certification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {["Tools documented", "Portfolio added", "Workflow documented", "Previous work", "Commercial-use information"].map(
              (s) => (
                <span key={s} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-800">
                  <BadgeCheck className="h-4 w-4" /> {s}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.2rem] bg-gradient-to-r from-accent to-accent-2 p-10 text-white">
          <h2 className="font-display text-4xl md:text-5xl">Ready to brief the right creator?</h2>
          <p className="mt-3 max-w-xl text-white/80">Start as a brand or publish your AI production stack as a creator.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-white text-ink hover:bg-violet-100" asChild>
              <Link to="/register?role=BRAND">Join as brand</Link>
            </Button>
            <Button className="border border-white bg-transparent text-white hover:bg-white/10" asChild>
              <Link to="/register?role=CREATOR">Join as creator</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
