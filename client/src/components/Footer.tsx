import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-accent-3" /> CreatorHub AI
          </div>
          <p className="mt-3 max-w-sm text-sm text-white/60">
            Discover AI creators. Build better campaigns. A marketplace designed for AI-native production, not generic
            freelance gigs.
          </p>
        </div>
        <div className="text-sm text-white/70">
          <p className="mb-2 font-semibold text-white">Product</p>
          <p>Creator search</p>
          <p>Brief builder</p>
          <p>Trust signals</p>
        </div>
        <div className="text-sm text-white/70">
          <p className="mb-2 font-semibold text-white">Hackathon</p>
          <p>HacXLerate 2026</p>
          <p>Kampus.VC challenge</p>
          <p>Team BYTEHACKERS</p>
        </div>
      </div>
    </footer>
  );
}
