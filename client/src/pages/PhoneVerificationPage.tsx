import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

export function PhoneVerificationPage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  // Step 1 = Enter Phone, Step 2 = Enter OTP
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300); // 5 min
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(true);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If user is already phone verified, redirect directly to dashboard or 'from'
  useEffect(() => {
    if (!authLoading && user && user.phoneVerified) {
      const dest = from ?? (user.role === "CREATOR" ? "/dashboard/creator" : "/dashboard/brand");
      navigate(dest, { replace: true });
    }
  }, [user, authLoading, from, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // OTP expiration countdown timer
  useEffect(() => {
    if (step !== 2 || expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expiresIn]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function validatePhoneNumber(raw: string): string | null {
    const cleaned = raw.trim().replace(/[\s\-()]/g, "");
    const withPlus = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
    if (!/^\+[1-9]\d{7,14}$/.test(withPlus)) {
      return "Please enter a valid phone number with country code (e.g., +1 415 555 2671 or +91 98765 43210)";
    }
    return null;
  }

  // Initial status check for dev/demo mode
  useEffect(() => {
    api<{ phoneVerified: boolean; isDevelopmentMode?: boolean }>("/api/auth/phone/status")
      .then((data) => {
        if (typeof data.isDevelopmentMode === "boolean") {
          setIsDevelopmentMode(data.isDevelopmentMode);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const valErr = validatePhoneNumber(phone);
    if (valErr) {
      setError(valErr);
      return;
    }

    setSending(true);
    try {
      const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
      const res = await api<{
        ok: boolean;
        message: string;
        expiresInSeconds: number;
        cooldownSeconds: number;
        isDevelopmentMode?: boolean;
      }>("/api/auth/phone/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      if (typeof res.isDevelopmentMode === "boolean") {
        setIsDevelopmentMode(res.isDevelopmentMode);
      }

      setCooldown(res.cooldownSeconds || 60);
      setExpiresIn(res.expiresInSeconds || 300);
      setStep(2);
      toast.success("Verification code sent to your phone");
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code";
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  function handleOtpChange(index: number, val: string) {
    const digits = val.replace(/\D/g, "");
    if (!digits) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    // Handle pasting multiple digits (e.g. 6-digit OTP copied)
    if (digits.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (digits[i]) newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = digits[0];
    setOtp(nextOtp);

    // Auto-focus next field
    if (index < 5 && digits) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setVerifying(true);
    try {
      const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
      const res = await api<{
        ok: boolean;
        message: string;
        user: User;
      }>("/api/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: normalizedPhone, otp: fullOtp }),
      });

      setSuccess(true);
      updateUser(res.user);
      toast.success("Phone verified successfully!");

      setTimeout(() => {
        const dest = from ?? (res.user.role === "CREATOR" ? "/dashboard/creator" : "/dashboard/brand");
        navigate(dest, { replace: true });
      }, 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="mb-4 flex items-center justify-between text-xs text-ink/40">
          <span className="font-semibold uppercase tracking-wider text-accent">Mandatory Security Step</span>
          <span>Step {step} of 2</span>
        </div>

        {/* Security & Mode badge */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-ink/5 bg-white/60 px-3.5 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-ink/70">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="font-medium">Anti-fraud verification</span>
          </div>
          {isDevelopmentMode ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700">
              Demo / Dev Mode
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700">
              Carrier Verified
            </span>
          )}
        </div>

        <Card className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-card backdrop-blur-xl">
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="font-display text-3xl text-ink">Verified!</h2>
              <p className="mt-2 text-sm text-ink/60">Your phone number has been verified.</p>
              <p className="mt-1 text-xs text-ink/40">Redirecting to your workspace…</p>
            </div>
          ) : step === 1 ? (
            <div>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/20 text-accent">
                  <Phone className="h-6 w-6" />
                </div>
                <h1 className="font-display text-3xl text-ink">Verify your phone</h1>
                <p className="mt-2 text-sm text-ink/60">
                  To protect creators and brands against impersonation and spam, all accounts require verified phone authentication.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Input
                      type="tel"
                      autoFocus
                      placeholder="+1 415 555 2671"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-4 font-mono text-base tracking-wide"
                      disabled={sending}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink/40">
                    Include country code (e.g., +1 for US/Canada, +44 for UK, +91 for India).
                  </p>
                </div>

                <div className="rounded-2xl border border-ink/5 bg-mist/60 p-3.5 text-xs text-ink/60">
                  <div className="flex items-center gap-2 font-medium text-ink">
                    <Lock className="h-3.5 w-3.5 text-accent" />
                    <span>Privacy guarantee</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink/50">
                    Your phone number is strictly encrypted and never visible on your public portfolio or brand profile.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={sending || !phone.trim()}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/20 text-accent">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="font-display text-3xl text-ink">Enter 6-digit code</h1>
                <p className="mt-2 text-sm text-ink/60">
                  We sent a code to <span className="font-semibold text-ink">{phone}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp(["", "", "", "", "", ""]);
                    setError(null);
                  }}
                  className="mt-1 text-xs text-accent hover:underline"
                >
                  Change phone number
                </button>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Expiry indicator */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-violet-50/70 px-3.5 py-2 text-xs">
                <span className="text-ink/60">Code expires in:</span>
                <span className={`font-mono font-semibold ${expiresIn < 60 ? "text-rose-600" : "text-accent"}`}>
                  {formatTime(expiresIn)}
                </span>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6 Digit Inputs */}
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-13 w-12 rounded-xl border border-ink/15 bg-white text-center font-mono text-2xl font-bold text-ink shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      disabled={verifying}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={verifying || otp.join("").length !== 6 || expiresIn <= 0}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying code…
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                {/* Resend Cooldown */}
                <div className="text-center text-xs text-ink/60">
                  {cooldown > 0 ? (
                    <p className="flex items-center justify-center gap-1.5 text-ink/40">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Resend code in {cooldown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={sending}
                      className="font-medium text-accent hover:underline disabled:opacity-50"
                    >
                      Didn't receive code? Resend SMS
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
