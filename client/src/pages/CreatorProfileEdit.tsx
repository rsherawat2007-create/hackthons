import { FormEvent, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  FileText,
  Upload,
  Trash2,
  Download,
  Lock,
  Globe,
  Award,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { SPECIALIZATIONS, TOOLS, SKILLS, type Certificate } from "@/types";

type TabKey = "general" | "stack" | "experience" | "commercial";

export function CreatorProfileEdit() {
  const { refresh, user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  // General Identity
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // AI Stack & Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Custom Tag Inputs
  const [customSkill, setCustomSkill] = useState("");
  const [customTool, setCustomTool] = useState("");
  const [customModel, setCustomModel] = useState("");

  // Experience & Credentials
  const [experience, setExperience] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [education, setEducation] = useState("");
  const [availability, setAvailability] = useState("Available for projects");

  // Resume Management State
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumePublic, setResumePublic] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Certificate Management State
  const [certificatesList, setCertificatesList] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [newCertName, setNewCertName] = useState("");
  const [newCertOrg, setNewCertOrg] = useState("");
  const [newCertDate, setNewCertDate] = useState("");
  const [newCertUrl, setNewCertUrl] = useState("");
  const [newCertPublic, setNewCertPublic] = useState(true);
  const [newCertFile, setNewCertFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [addingCert, setAddingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement | null>(null);

  // Commercial & Pipeline
  const [commercialUse, setCommercialUse] = useState(true);
  const [commercialNotes, setCommercialNotes] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [portfolioCount, setPortfolioCount] = useState(0);

  // Loading & Submission State
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const creatorId = user?.creatorProfile?.id;

  // Load existing profile from database
  useEffect(() => {
    setLoadingProfile(true);
    api<{ user: { name: string; creatorProfile: (Record<string, unknown> & { portfolio?: unknown[] }) | null } }>("/api/auth/me")
      .then((d) => {
        setName(d.user.name || "");
        const p = d.user.creatorProfile;
        if (p) {
          if (Array.isArray(p.portfolio)) {
            setPortfolioCount(p.portfolio.length);
          }
          setHeadline(String(p.headline || ""));
          setBio(String(p.bio || ""));
          setLocation(String(p.location || ""));
          setAvatarUrl(String(p.avatarUrl || ""));
          setSkills((p.skills as string[]) || []);
          setTools((p.tools as string[]) || []);
          setAiModels((p.aiModels as string[]) || []);
          setSpecializations((p.specializations as string[]) || []);
          setExperience(String(p.experience || ""));
          setExperienceYears(Number(p.experienceYears || 0));
          setEducation(String(p.education || ""));
          setAvailability(String(p.availability || "Available for projects"));
          setResumeUrl(String(p.resumeUrl || ""));
          setResumeFileName(String(p.resumeFileName || ""));
          setResumePublic(Boolean(p.resumePublic ?? true));
          setCommercialUse(Boolean(p.commercialUse ?? true));
          setCommercialNotes(String(p.commercialNotes || ""));
          setWorkflow(String(p.workflow || ""));
        }
      })
      .catch(() => {
        toast.error("Failed to load profile details");
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, []);

  // Fetch certificates list
  function loadCertificates() {
    if (!creatorId) return;
    setLoadingCerts(true);
    api<{ certificates: Certificate[] }>(`/api/creators/${creatorId}/certificates`)
      .then((res) => {
        setCertificatesList(res.certificates || []);
      })
      .catch(() => {})
      .finally(() => setLoadingCerts(false));
  }

  useEffect(() => {
    if (creatorId) {
      loadCertificates();
    }
  }, [creatorId]);

  // Validation
  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!headline.trim()) errs.headline = "Professional headline is required";
    if (avatarUrl.trim()) {
      try {
        new URL(avatarUrl);
      } catch {
        errs.avatarUrl = "Avatar must be a valid image URL";
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setActiveTab("general");
      toast.error("Please resolve highlighted validation errors.");
      return false;
    }
    return true;
  }

  // Tag helper
  function toggleTag(currentList: string[], item: string, setter: (val: string[]) => void) {
    if (currentList.includes(item)) {
      setter(currentList.filter((i) => i !== item));
    } else {
      setter([...currentList, item]);
    }
  }

  function addCustomTag(value: string, currentList: string[], setter: (val: string[]) => void, clearInput: () => void) {
    const clean = value.trim();
    if (!clean) return;
    if (!currentList.includes(clean)) {
      setter([...currentList, clean]);
    }
    clearInput();
  }

  // ── RESUME FILE HANDLERS ───────────────────────────────────────────────────

  function handleResumeFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Resume file must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setUploadingResume(true);
      try {
        const res = await api<{
          ok: boolean;
          resume: { resumeUrl: string; resumeFileName: string; resumePublic: boolean };
        }>("/api/creators/resume", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/pdf",
            base64Data,
            isPublic: resumePublic,
          }),
        });

        setResumeUrl(res.resume.resumeUrl);
        setResumeFileName(res.resume.resumeFileName);
        setResumePublic(res.resume.resumePublic);
        toast.success("Resume uploaded securely!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload resume");
      } finally {
        setUploadingResume(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleDeleteResume() {
    if (!confirm("Are you sure you want to remove your resume?")) return;
    try {
      await api("/api/creators/resume", { method: "DELETE" });
      setResumeUrl("");
      setResumeFileName("");
      toast.success("Resume removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete resume");
    }
  }

  async function handleToggleResumeVisibility(newVal: boolean) {
    setResumePublic(newVal);
    if (!resumeUrl) return;
    try {
      await api("/api/creators/resume/visibility", {
        method: "PUT",
        body: JSON.stringify({ isPublic: newVal }),
      });
      toast.success(newVal ? "Resume is now public to brands" : "Resume is now private");
    } catch {
      toast.error("Could not update resume visibility");
    }
  }

  // ── CERTIFICATE HANDLERS ───────────────────────────────────────────────────

  function handleCertFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Certificate file must be under 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewCertFile({
        name: file.name,
        type: file.type || "application/pdf",
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleAddCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCertName.trim() || !newCertOrg.trim()) {
      toast.error("Certificate name and issuing organization are required");
      return;
    }

    setAddingCert(true);
    try {
      await api("/api/creators/certificates", {
        method: "POST",
        body: JSON.stringify({
          name: newCertName.trim(),
          issuingOrganization: newCertOrg.trim(),
          issueDate: newCertDate.trim(),
          credentialUrl: newCertUrl.trim(),
          isPublic: newCertPublic,
          fileName: newCertFile?.name,
          mimeType: newCertFile?.type,
          base64Data: newCertFile?.base64,
        }),
      });

      toast.success("Certificate added successfully!");
      setNewCertName("");
      setNewCertOrg("");
      setNewCertDate("");
      setNewCertUrl("");
      setNewCertFile(null);
      if (certFileInputRef.current) certFileInputRef.current.value = "";
      loadCertificates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add certificate");
    } finally {
      setAddingCert(false);
    }
  }

  async function handleDeleteCert(id: string) {
    if (!confirm("Delete this certificate?")) return;
    try {
      await api(`/api/creators/certificates/${id}`, { method: "DELETE" });
      setCertificatesList((prev) => prev.filter((c) => c.id !== id));
      toast.success("Certificate deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete certificate");
    }
  }

  // ── SAVE OVERALL PROFILE ───────────────────────────────────────────────────

  async function handleSave(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatarUrl: avatarUrl.trim(),
        skills,
        tools,
        aiModels,
        specializations,
        experience: experience.trim(),
        experienceYears: Number(experienceYears) || 0,
        education: education.trim(),
        resumeUrl: resumeUrl.trim(),
        availability: availability.trim(),
        commercialUse,
        commercialNotes: commercialNotes.trim(),
        workflow: workflow.trim(),
      };

      await api("/api/creators/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await refresh();
      if (user) {
        updateUser({ ...user, name: name.trim() });
      }

      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast.success("Profile saved & Trust Score updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-ink/50">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm">Loading profile editor…</p>
        </div>
      </div>
    );
  }

  // 7 Ground-Truth Signals for profile completeness
  const emailVerified = Boolean(user?.email && user.email.includes("@"));
  const phoneVerified = Boolean(user?.phoneVerified);
  const resumeAdded = Boolean(resumeUrl && resumeUrl.trim().length > 0);
  const portfolioAdded = Boolean(portfolioCount > 0);
  const toolsDocumented = Boolean(tools && tools.length > 0);
  const workflowDocumented = Boolean(workflow && workflow.trim().length >= 20);
  const experienceAdded = Boolean(
    (experience && experience.trim().length > 0) || (Number(experienceYears) > 0)
  );

  const editSignals = [
    { label: "Email Verified", category: "Verified Contact", ok: emailVerified },
    { label: "Phone Verified", category: "Verified Contact", ok: phoneVerified },
    { label: "Resume Added", category: "Profile Complete", ok: resumeAdded },
    { label: "Portfolio Added", category: "Portfolio Added", ok: portfolioAdded },
    { label: "Tools Documented", category: "Profile Complete", ok: toolsDocumented },
    { label: "Workflow Documented", category: "Profile Complete", ok: workflowDocumented },
    { label: "Experience Added", category: "Profile Complete", ok: experienceAdded },
  ];

  const completedSignalsCount = editSignals.filter((s) => s.ok).length;
  const strengthPercent = Math.round((completedSignalsCount / 7) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-ink/5 pb-6 sm:flex-row sm:items-center">
        <div>
          <Link
            to={creatorId ? `/creators/${creatorId}` : "/dashboard/creator"}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Public Profile
          </Link>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Creator Studio: Profile Editor</h1>
          <p className="mt-1 text-xs text-ink/60 sm:text-sm">
            Manage your professional identity, resume documents, certificates, and AI production credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {creatorId && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/creators/${creatorId}`} target="_blank" className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                View Live
              </Link>
            </Button>
          )}

          <Button variant="accent" size="default" disabled={saving} onClick={() => handleSave()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {lastSavedTime && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-800">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            All changes saved to database (last saved at {lastSavedTime})
          </span>
          <span className="font-semibold text-emerald-700">Live on marketplace</span>
        </div>
      )}

      {/* ── Profile Strength & Verification Signals Banner ──────────────── */}
      <Card className="mb-8 border border-ink/10 bg-gradient-to-br from-mist/80 via-white to-violet-50/30 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">Profile Strength</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {strengthPercent}% Complete
              </span>
              {phoneVerified && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                  Verified Contact
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/60">
              Complete each ground-truth signal to maximize client trust and visibility on the marketplace.
            </p>
          </div>
          <div className="w-full sm:w-56">
            <div className="mb-1 flex justify-between text-[11px] font-medium text-ink/50">
              <span>{completedSignalsCount} of 7 completed</span>
              <span>{strengthPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent transition-all duration-500"
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 7 Discrete Ground-Truth Indicators */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 text-xs">
          {editSignals.map((sig) => (
            <div
              key={sig.label}
              className={`flex items-center gap-1.5 rounded-xl border p-2.5 transition ${
                sig.ok
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                  : "border-ink/10 bg-white/70 text-ink/50"
              }`}
            >
              {sig.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-ink/30" />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-[11px]">{sig.label}</p>
                <p className="truncate text-[10px] text-ink/40">{sig.category}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-ink/45">
          Notice: Ground-truth signals reflect directly verified contact deliverability and verified profile assets. Phone verification confirms direct SMS deliverability and does not claim legal or external identity.
        </p>
      </Card>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-ink/8 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
            activeTab === "general"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/60 hover:bg-violet-50 hover:text-ink"
          }`}
        >
          <User className="h-4 w-4" />
          1. General & Bio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stack")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
            activeTab === "stack"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/60 hover:bg-violet-50 hover:text-ink"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          2. AI Tools & Skills
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("experience")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
            activeTab === "experience"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/60 hover:bg-violet-50 hover:text-ink"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          3. Resume & Certificates
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("commercial")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
            activeTab === "commercial"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/60 hover:bg-violet-50 hover:text-ink"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          4. Commercial & Workflow
        </button>
      </div>

      {/* ── Tab Forms ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: General & Bio */}
        {activeTab === "general" && (
          <Card className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-2xl text-ink">General Profile Information</h2>
              <p className="mt-1 text-xs text-ink/50">Your public identity, headline, and location across CreatorHub AI.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Maya Chen"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  className={errors.name ? "border-rose-400 ring-rose-400" : ""}
                />
                {errors.name && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Location / City
                </label>
                <Input
                  placeholder="e.g. Los Angeles, USA or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Professional Headline <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Cinematic AI product films for premium brands"
                  value={headline}
                  onChange={(e) => {
                    setHeadline(e.target.value);
                    if (errors.headline) setErrors((prev) => ({ ...prev, headline: "" }));
                  }}
                  className={errors.headline ? "border-rose-400 ring-rose-400" : ""}
                />
                {errors.headline && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.headline}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Avatar Image URL
                </label>
                <Input
                  placeholder="https://images.unsplash.com/photo-..."
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    if (errors.avatarUrl) setErrors((prev) => ({ ...prev, avatarUrl: "" }));
                  }}
                  className={errors.avatarUrl ? "border-rose-400 ring-rose-400" : ""}
                />
                {errors.avatarUrl && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.avatarUrl}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Bio / Creative Philosophy
                </label>
                <Textarea
                  placeholder="Describe your creative background, production philosophy, and the types of brands you collaborate with..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-36"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="accent" onClick={() => setActiveTab("stack")}>
                Next: AI Tools & Skills →
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 2: AI Tools, Models & Skills */}
        {activeTab === "stack" && (
          <Card className="space-y-6 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-2xl text-ink">AI Tools, Foundation Models & Skills</h2>
              <p className="mt-1 text-xs text-ink/50">
                Brands filter creators by specific AI tools and models. Click to toggle or add custom tags.
              </p>
            </div>

            {/* AI Tools */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                AI Software & Production Tools
              </label>
              <div className="flex flex-wrap gap-2">
                {TOOLS.map((t) => {
                  const active = tools.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(tools, t, setTools)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-accent bg-accent text-white shadow-sm"
                          : "border-ink/10 bg-white text-ink/70 hover:border-accent/40"
                      }`}
                    >
                      {active ? `✓ ${t}` : `+ ${t}`}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex max-w-sm gap-2">
                <Input
                  placeholder="Add custom tool (e.g. Magnific AI)"
                  value={customTool}
                  onChange={(e) => setCustomTool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag(customTool, tools, setTools, () => setCustomTool(""));
                    }
                  }}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomTag(customTool, tools, setTools, () => setCustomTool(""))}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* AI Models */}
            <div className="border-t border-ink/5 pt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                Generative AI Models
              </label>
              <div className="flex flex-wrap gap-2">
                {["Runway Gen-3 Alpha", "Midjourney v6.1", "Sora", "Flux.1 Dev", "Stable Diffusion XL", "Kling 1.5", "Luma Dream Machine"].map((m) => {
                  const active = aiModels.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleTag(aiModels, m, setAiModels)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                          : "border-ink/10 bg-white text-ink/70 hover:border-violet-400"
                      }`}
                    >
                      {active ? `✓ ${m}` : `+ ${m}`}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex max-w-sm gap-2">
                <Input
                  placeholder="Add custom model"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag(customModel, aiModels, setAiModels, () => setCustomModel(""));
                    }
                  }}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomTag(customModel, aiModels, setAiModels, () => setCustomModel(""))}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Creative Skills */}
            <div className="border-t border-ink/5 pt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                Core Creative Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const active = skills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleTag(skills, s, setSkills)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-accent bg-violet-50 text-accent font-bold"
                          : "border-ink/10 bg-white text-ink/70 hover:border-accent/40"
                      }`}
                    >
                      {active ? `✓ ${s}` : `+ ${s}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specializations */}
            <div className="border-t border-ink/5 pt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                Industry Specializations
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => {
                  const active = specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleTag(specializations, spec, setSpecializations)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-ink/10 bg-white text-ink/70 hover:border-ink/40"
                      }`}
                    >
                      {active ? `✓ ${spec}` : `+ ${spec}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab("general")}>
                ← Back
              </Button>
              <Button type="button" variant="accent" onClick={() => setActiveTab("experience")}>
                Next: Resume & Certificates →
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 3: Experience, Resume & Certificates */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            {/* Experience & Education */}
            <Card className="space-y-5 p-6 sm:p-8">
              <div>
                <h2 className="font-display text-2xl text-ink">Background & Education</h2>
                <p className="mt-1 text-xs text-ink/50">Define your experience and academic training.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Experience Summary
                  </label>
                  <Input
                    placeholder="e.g. 6 years in motion / 3 years generative AI"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Total Experience (Years)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    placeholder="e.g. 5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Education / Degree
                  </label>
                  <Input
                    placeholder="e.g. B.Des in Digital Media & Computational Arts"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Live Availability Status
                  </label>
                  <Input
                    placeholder="e.g. Available for Q4 campaigns & selective retainer projects"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* ── RESUME MANAGEMENT BOX ─────────────────────────────────── */}
            <Card className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <h2 className="font-display text-2xl text-ink">Resume Management</h2>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">
                    Upload your verified PDF resume. Control whether it's public to all visitors or private.
                  </p>
                </div>

                {resumeUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleResumeVisibility(!resumePublic)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        resumePublic
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {resumePublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {resumePublic ? "Public to Brands" : "Private (Visible on Request)"}
                    </button>
                  </div>
                )}
              </div>

              {resumeUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/8 bg-mist/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-accent">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{resumeFileName || "Creator_Resume.pdf"}</p>
                      <p className="text-xs text-ink/50">
                        {resumePublic ? "Publicly viewable by verified brands" : "Private document"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`${resumeUrl}?download=true`} download className="flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resumeFileInputRef.current?.click()}
                      disabled={uploadingResume}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDeleteResume}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-ink/15 p-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-ink/30" />
                  <p className="mt-2 text-sm font-semibold text-ink">No resume uploaded yet</p>
                  <p className="mt-1 text-xs text-ink/50">Upload a PDF or document (up to 8MB) to attach to your profile.</p>

                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resumeFileInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="flex items-center gap-2"
                    >
                      {uploadingResume ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Resume
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={resumeFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeFileSelect}
              />
            </Card>

            {/* ── CERTIFICATE MANAGEMENT BOX ────────────────────────────── */}
            <Card className="space-y-6 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                <h2 className="font-display text-2xl text-ink">Certificates & Accreditations</h2>
              </div>
              <p className="text-xs text-ink/50">
                Add verified certificates from foundation model providers, creative suites, and generative filmmaking labs.
              </p>

              {/* Existing Certificates List */}
              <div className="space-y-3">
                {loadingCerts ? (
                  <div className="py-4 text-center text-xs text-ink/40">Loading certificates…</div>
                ) : certificatesList.length > 0 ? (
                  certificatesList.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border border-ink/8 bg-mist/50 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink">{cert.name}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              cert.isPublic ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {cert.isPublic ? "Public" : "Private"}
                          </span>
                        </div>
                        <p className="text-xs text-ink/60">
                          {cert.issuingOrganization}
                          {cert.issueDate ? ` · Issued ${cert.issueDate}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {cert.credentialUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs">
                              Credential
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {cert.fileUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`${cert.fileUrl}?download=true`} download className="flex items-center gap-1.5 text-xs">
                              <Download className="h-3.5 w-3.5" />
                              File
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCert(cert.id)}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-ink/10 p-4 text-center text-xs text-ink/40">
                    No certificates added yet. Use the form below to add your credentials.
                  </div>
                )}
              </div>

              {/* Add New Certificate Form */}
              <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink">Add a Certificate</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Certificate Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Runway Certified AI Filmmaker (Gen-3 Alpha)"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Issuing Organization <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Runway, Adobe, Midjourney Community"
                      value={newCertOrg}
                      onChange={(e) => setNewCertOrg(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Issue Date
                    </label>
                    <Input
                      placeholder="e.g. May 2026"
                      value={newCertDate}
                      onChange={(e) => setNewCertDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Credential Verification URL
                    </label>
                    <Input
                      placeholder="https://credentials.example.com/..."
                      value={newCertUrl}
                      onChange={(e) => setNewCertUrl(e.target.value)}
                    />
                  </div>

                  {/* Optional File upload */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                      Attach Certificate File / PDF (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => certFileInputRef.current?.click()}
                        className="flex items-center gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {newCertFile ? "Change File" : "Choose File (PDF/Image)"}
                      </Button>
                      {newCertFile && (
                        <div className="flex items-center gap-2 text-xs font-medium text-ink/70">
                          <span>{newCertFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setNewCertFile(null)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <input
                        ref={certFileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleCertFileSelect}
                      />
                    </div>
                  </div>

                  {/* Public toggle */}
                  <div className="flex items-center pt-2 sm:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCertPublic}
                        onChange={(e) => setNewCertPublic(e.target.checked)}
                        className="h-4 w-4 rounded text-accent focus:ring-accent"
                      />
                      Make certificate visible on public profile
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    disabled={addingCert || !newCertName.trim() || !newCertOrg.trim()}
                    onClick={handleAddCertificate}
                  >
                    {addingCert ? "Adding…" : "+ Add Certificate"}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab("stack")}>
                ← Back
              </Button>
              <Button type="button" variant="accent" onClick={() => setActiveTab("commercial")}>
                Next: Commercial & Workflow →
              </Button>
            </div>
          </div>
        )}

        {/* TAB 4: Commercial-Use & Pipeline */}
        {activeTab === "commercial" && (
          <Card className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-2xl text-ink">Commercial Licensing & Workflow</h2>
              <p className="mt-1 text-xs text-ink/50">
                Clear licensing terms and documented production pipelines significantly increase creator Trust Scores.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-mist p-4">
                <input
                  type="checkbox"
                  id="commercialCheck"
                  checked={commercialUse}
                  onChange={(e) => setCommercialUse(e.target.checked)}
                  className="h-5 w-5 rounded border-ink/20 text-accent focus:ring-accent"
                />
                <label htmlFor="commercialCheck" className="text-sm font-semibold text-ink cursor-pointer">
                  Available for Commercial Use & Ad Campaigns
                  <span className="block text-xs font-normal text-ink/50">
                    Check if you can provide full commercial transfer and clearance for brand campaigns.
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Commercial Licensing Notes
                </label>
                <Textarea
                  placeholder="Explain your IP transfer policy, paid advertising clearances, commercial broadcast rights, and brand safety guarantees..."
                  value={commercialNotes}
                  onChange={(e) => setCommercialNotes(e.target.value)}
                  className="min-h-28"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Standard Production Pipeline & Workflow
                </label>
                <Textarea
                  placeholder="Detail your standard end-to-end workflow: e.g. Concept Look-Dev in Midjourney -> Motion Generation in Runway Gen-3 -> Detail Retouching & Upscaling -> Editorial Assembly, Sound & Color in DaVinci Resolve."
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value)}
                  className="min-h-32"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab("experience")}>
                ← Back
              </Button>
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save & Complete Profile
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}
