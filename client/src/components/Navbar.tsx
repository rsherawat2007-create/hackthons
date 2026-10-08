import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeftRight, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCompare } from "@/context/CompareContext";
import { useBilling } from "@/context/BillingContext";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, logout } = useAuth();
  const { compareCount } = useCompare();
  const { usage, openUpgradeModal } = useBilling();
  const navigate = useNavigate();
  const dash = user?.role === "CREATOR" ? "/dashboard/creator" : "/dashboard/brand";

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-ink text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          CreatorHub <span className="text-accent">AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
          <NavLink to="/creators">Find creators</NavLink>
          <NavLink
            to="/assistant"
            className="flex items-center gap-1.5 font-semibold text-accent transition hover:text-accent/80"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
            CreatorHub AI
          </NavLink>
          <NavLink to="/ai-brief-builder">AI Brief Builder</NavLink>
          <NavLink
            to="/compare"
            className="flex items-center gap-1.5 transition"
          >
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.2 text-[10px] font-bold text-white">
                {compareCount}
              </span>
            )}
          </NavLink>
          {user?.role === "BRAND" && <NavLink to="/briefs">Briefs</NavLink>}
          {user?.role === "BRAND" && <NavLink to="/shortlist">Shortlist</NavLink>}
          {user?.role === "CREATOR" && <NavLink to="/creator/portfolio">My Portfolio</NavLink>}
          {user && <NavLink to="/engagements">Engagements</NavLink>}
        </nav>
        <div className="flex items-center gap-2">
          {user?.role === "BRAND" && (
            <button
              type="button"
              onClick={openUpgradeModal}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                usage.isLimitReached
                  ? "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200"
                  : usage.engagementsRemaining === 1
                  ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200"
                  : "bg-mist text-ink hover:bg-ink/10 border border-ink/10"
              }`}
              title="Click to view brand plans & upgrade"
            >
              <Zap className="h-3 w-3 text-accent" />
              <span>{usage.displayStatus}</span>
            </button>
          )}
          {user ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(user?.phoneVerified === false ? "/verify-phone" : dash)}
              >
                Dashboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" variant="accent" asChild>
                <Link to="/register">Join</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
