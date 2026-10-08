import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, AlertCircle, BadgeCheck, Clapperboard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import type { Role } from "@/types";

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

/* ── Password strength meter ─────────────────────────────────────────────── */
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "", color: "bg-transparent" },
    { label: "Weak", color: "bg-rose-400" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-blue-400" },
    { label: "Strong", color: "bg-emerald-400" },
    { label: "Very strong", color: "bg-emerald-500" },
  ];
  return { score, ...levels[score] };
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

/* ── Role card ───────────────────────────────────────────────────────────── */
function RoleCard({
  value,
  selected,
  onSelect,
}: {
  value: Role;
  selected: boolean;
  onSelect: () => void;
}) {
  const isBrand = value === "BRAND";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all",
        selected
          ? "border-accent bg-gradient-to-b from-violet-50 to-white shadow-glow"
          : "border-ink/8 bg-white hover:border-accent/40"
      )}
    >
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl",
          selected ? "bg-gradient-to-br from-accent to-accent-2 text-white" : "bg-ink/5 text-ink/60"
        )}
      >
        {isBrand ? <Building2 className="h-5 w-5" /> : <Clapperboard className="h-5 w-5" />}
      </span>
      <div>
        <p className="font-semibold text-ink">
          {isBrand ? "Brand / Agency" : "AI Creator"}
        </p>
        <p className="mt-0.5 text-xs text-ink/50">
          {isBrand
            ? "Find and brief AI creators"
            : "Showcase your AI production stack"}
        </p>
      </div>
      {selected && (
        <BadgeCheck className="h-4 w-4 text-accent" />
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REGISTER — 2-step flow
   Step 1: Choose role
   Step 2: Fill details + submit
═══════════════════════════════════════════════════════════════════════════ */
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Step management
  const [step, setStep] = useState<1 | 2>(1);

  // Form state
  const [role, setRole] = useState<Role>((params.get("role") as Role) || "BRAND");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Error state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    companyName?: string;
    form?: string;
  }>({});

  const strength = password ? passwordStrength(password) : null;

  function validateStep2() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Full name is required";
    else if (name.trim().length < 2) e.name = "Name must be at least 2 characters";

    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";

    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";

    if (role === "BRAND" && !companyName.trim()) e.companyName = "Company name is required";

    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        companyName: role === "BRAND" ? companyName.trim() : undefined,
      });
      setSuccess(true);
      toast.success("Account created! Please verify your phone number to continue.");
      setTimeout(() => {
        navigate("/verify-phone", { replace: true });
      }, 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create account";
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 1 — Role picker ─────────────────────────────────────────────── */
  if (step === 1) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl text-ink">Join CreatorHub AI</h1>
            <p className="mt-2 text-sm text-ink/60">Who are you signing up as?</p>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-card backdrop-blur-xl">
            <GoogleButton label="Continue with Google" />

            <Divider />

            <div className="grid grid-cols-2 gap-4">
              <RoleCard value="BRAND" selected={role === "BRAND"} onSelect={() => setRole("BRAND")} />
              <RoleCard value="CREATOR" selected={role === "CREATOR"} onSelect={() => setRole("CREATOR")} />
            </div>

            <Button
              variant="accent"
              size="lg"
              className="mt-6 w-full"
              onClick={() => setStep(2)}
            >
              Continue as {role === "BRAND" ? "Brand / Agency" : "AI Creator"}
            </Button>

            <p className="mt-5 text-center text-sm text-ink/60">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2 — Details form ───────────────────────────────────────────── */
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setStep(1); setErrors({}); }}
            className="text-sm text-ink/50 hover:text-ink"
          >
            ← Back
          </button>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-accent to-accent-2" />
            </div>
          </div>
          <span className="text-xs text-ink/40">Step 2 of 2</span>
        </div>

        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-violet-50 px-3 py-1 text-xs font-semibold text-accent">
            {role === "BRAND" ? <Building2 className="h-3.5 w-3.5" /> : <Clapperboard className="h-3.5 w-3.5" />}
            {role === "BRAND" ? "Brand / Agency" : "AI Creator"}
          </span>
          <h1 className="mt-3 font-display text-3xl text-ink">Create your account</h1>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-card backdrop-blur-xl">

          {/* Success overlay */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
                <BadgeCheck className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-ink">Account created!</p>
              <p className="text-sm text-ink/50">Redirecting to your dashboard…</p>
            </div>
          )}

          {!success && (
            <>
              {/* Form-level error */}
              {errors.form && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errors.form}
                </div>
              )}

              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Full name
                  </label>
                  <Input
                    autoFocus
                    autoComplete="name"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    className={errors.name ? "border-rose-400 ring-rose-400" : ""}
                    disabled={loading}
                  />
                  <FieldError msg={errors.name} />
                </div>

                {/* Company name (brands only) */}
                {role === "BRAND" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Company / Agency name
                    </label>
                    <Input
                      autoComplete="organization"
                      placeholder="Acme Brands"
                      value={companyName}
                      onChange={(e) => { setCompanyName(e.target.value); setErrors((p) => ({ ...p, companyName: undefined })); }}
                      className={errors.companyName ? "border-rose-400 ring-rose-400" : ""}
                      disabled={loading}
                    />
                    <FieldError msg={errors.companyName} />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Email
                  </label>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, form: undefined })); }}
                    className={errors.email ? "border-rose-400 ring-rose-400" : ""}
                    disabled={loading}
                  />
                  <FieldError msg={errors.email} />
                </div>

                {/* Password + strength */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
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

                  {/* Strength meter */}
                  {password && strength && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all",
                              i <= strength.score ? strength.color : "bg-ink/10"
                            )}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p className="text-xs text-ink/50">{strength.label}</p>
                      )}
                    </div>
                  )}
                  <FieldError msg={errors.password} />
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-ink/60">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ink/30">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
