import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

/* ── Inline field-level error ────────────────────────────────────────────── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-rose-600">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {msg}
    </p>
  );
}

/* ── Google button ───────────────────────────────────────────────────────── */
function GoogleButton({ label, disabled }: { label: string; disabled?: boolean }) {
  function handleGoogle() {
    toast.info("Google sign-in is coming soon. Use email & password for now.");
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleGoogle}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-50"
      )}
    >
      {/* Google G mark (inline SVG — no external dependency) */}
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.2 33.2 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3l6-6C34.7 6.4 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" />
        <path fill="#34A853" d="M6.3 14.7l6.9 5.1C14.9 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 3l6-6C34.7 6.4 29.6 4 24 4 16 4 9.1 8.4 6.3 14.7z" />
        <path fill="#FBBC05" d="M24 44c5.5 0 10.5-1.9 14.4-5l-6.7-5.5C29.7 35.2 27 36 24 36c-5.6 0-10.3-3.7-11.9-8.8L5.1 33c3.1 6.7 9.6 11 18.9 11z" />
        <path fill="#EA4335" d="M43.6 20H24v8.5h11.8c-.8 2.4-2.4 4.4-4.5 5.8l6.7 5.5C42 36.2 44 30.6 44 24c0-1.3-.2-2.7-.4-4z" />
      </svg>
      {label}
    </button>
  );
}

/* ── Divider ─────────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div className="relative my-5 flex items-center">
      <div className="flex-1 border-t border-ink/10" />
      <span className="mx-4 text-xs text-ink/40">or continue with email</span>
      <div className="flex-1 border-t border-ink/10" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════════════════ */
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      if (user.phoneVerified === false) {
        navigate("/verify-phone", { replace: true, state: { from } });
      } else {
        const dest = from ?? (user.role === "CREATOR" ? "/dashboard/creator" : "/dashboard/brand");
        navigate(dest, { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(which: "brand" | "creator") {
    setEmail(which === "brand" ? "apex@creatorhub.ai" : "maya@creatorhub.ai");
    setPassword("DemoPass123!");
    setErrors({});
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink/60">Sign in to your CreatorHub AI account</p>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-card backdrop-blur-xl">
          {/* Google */}
          <GoogleButton label="Continue with Google" disabled={loading} />

          <Divider />

          {/* Form-level error banner */}
          {errors.form && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errors.form}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                Email
              </label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined, form: undefined })); }}
                className={errors.email ? "border-rose-400 ring-rose-400" : ""}
                disabled={loading}
              />
              <FieldError msg={errors.email} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, form: undefined })); }}
                  className={cn("pr-10", errors.password ? "border-rose-400 ring-rose-400" : "")}
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            <Button type="submit" variant="accent" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
            </Button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-5 rounded-2xl border border-ink/5 bg-mist p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/40">Demo accounts</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemo("brand")}
                className="rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
              >
                Brand (Apex Athletics)
              </button>
              <button
                type="button"
                onClick={() => fillDemo("creator")}
                className="rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
              >
                Creator (Maya Chen)
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-ink/60">
            New here?{" "}
            <Link to="/register" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
