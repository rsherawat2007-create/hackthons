import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Film,
  Layers,
  Wrench,
  Clock,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { TOOLS, SKILLS, CONTENT_TYPES } from "@/types";

export interface GeneratedBriefForm {
  campaignTitle: string;
  contentType: string;
  style: string;
  targetAudience: string;
  platform: string;
  aspectRatio: string;
  duration: string;
  requiredSkills: string[];
  recommendedTools: string[];
  commercialUse: boolean;
  deliverables: string[];
  creativeDirection: string;
  description?: string;
}

const EXAMPLE_IDEAS = [
  "I need a 30 second Instagram advertisement for my sneaker brand.",
  "Luxury skincare launch video for TikTok, 15 seconds with macro texture shots and clean aesthetic.",
  "Cinematic product spot for a mechanical watch with dark moody lighting, 30s 16:9 4K.",
  "Motion graphics and 3D animation promo for a consumer fintech mobile app.",
];

/**
 * Validates the AI response against all 12 required structured fields.
 */
function validateAiBriefResponse(raw: unknown): {
  valid: boolean;
  data?: GeneratedBriefForm;
  errors: string[];
} {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: ["AI response is not a valid JSON object"] };
  }

  const obj = raw as Record<string, unknown>;

  // 1. campaignTitle
  if (typeof obj.campaignTitle !== "string" || !obj.campaignTitle.trim()) {
    errors.push("Missing or invalid 'campaignTitle'");
  }

  // 2. contentType
  if (typeof obj.contentType !== "string" || !obj.contentType.trim()) {
    errors.push("Missing or invalid 'contentType'");
  }

  // 3. style
  if (typeof obj.style !== "string" || !obj.style.trim()) {
    errors.push("Missing or invalid 'style'");
  }

  // 4. targetAudience
  if (typeof obj.targetAudience !== "string" || !obj.targetAudience.trim()) {
    errors.push("Missing or invalid 'targetAudience'");
  }

  // 5. platform
  if (typeof obj.platform !== "string" || !obj.platform.trim()) {
    errors.push("Missing or invalid 'platform'");
  }

  // 6. aspectRatio
  if (typeof obj.aspectRatio !== "string" || !obj.aspectRatio.trim()) {
    errors.push("Missing or invalid 'aspectRatio'");
  }

  // 7. duration
  if (typeof obj.duration !== "string" || !obj.duration.trim()) {
    errors.push("Missing or invalid 'duration'");
  }

  // 8. requiredSkills
  if (!Array.isArray(obj.requiredSkills) || obj.requiredSkills.length === 0) {
    errors.push("Missing or empty 'requiredSkills' array");
  }

  // 9. recommendedTools
  if (!Array.isArray(obj.recommendedTools) || obj.recommendedTools.length === 0) {
    errors.push("Missing or empty 'recommendedTools' array");
  }

  // 10. commercialUse
  if (typeof obj.commercialUse !== "boolean") {
    errors.push("Missing or invalid boolean 'commercialUse'");
  }

  // 11. deliverables
  if (!Array.isArray(obj.deliverables) || obj.deliverables.length === 0) {
    errors.push("Missing or empty 'deliverables' array");
  }

  // 12. creativeDirection
  if (typeof obj.creativeDirection !== "string" || !obj.creativeDirection.trim()) {
    errors.push("Missing or invalid 'creativeDirection'");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      campaignTitle: String(obj.campaignTitle).trim(),
      contentType: String(obj.contentType).trim(),
      style: String(obj.style).trim(),
      targetAudience: String(obj.targetAudience).trim(),
      platform: String(obj.platform).trim(),
      aspectRatio: String(obj.aspectRatio).trim(),
      duration: String(obj.duration).trim(),
      requiredSkills: (obj.requiredSkills as unknown[]).map(String),
      recommendedTools: (obj.recommendedTools as unknown[]).map(String),
      commercialUse: Boolean(obj.commercialUse),
      deliverables: (obj.deliverables as unknown[]).map(String),
      creativeDirection: String(obj.creativeDirection).trim(),
      description: typeof obj.description === "string" ? obj.description : undefined,
    },
  };
}

export function AiBriefBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [idea, setIdea] = useState(
    "I need a 30 second Instagram advertisement for my sneaker brand."
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<string>("");
  const [validationPassed, setValidationPassed] = useState(false);

  // Editable Form State for all 12 fields
  const [form, setForm] = useState<GeneratedBriefForm | null>(null);

  // Custom tool / skill / deliverable inputs
  const [toolInput, setToolInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");

  // Budget & Deadline additional metadata for saving
  const [budget, setBudget] = useState("$5,000 – $10,000");
  const [deadline, setDeadline] = useState("");

  async function handleGenerate() {
    const prompt = idea.trim();
    if (!prompt) {
      toast.error("Please enter a campaign idea");
      return;
    }

    setLoading(true);
    setValidationPassed(false);

    try {
      const res = await api<{
        brief: unknown;
        source: string;
        provider?: string;
      }>("/api/ai/generate-brief", {
        method: "POST",
        body: JSON.stringify({ idea: prompt }),
      });

      // Validate the AI response before displaying it
      const validation = validateAiBriefResponse(res.brief);
      if (!validation.valid || !validation.data) {
        toast.error(`AI response validation failed: ${validation.errors.join(", ")}`);
        return;
      }

      setForm({
        ...validation.data,
        description: validation.data.description || prompt,
      });
      setSource(res.source);
      setValidationPassed(true);

      toast.success(
        res.source === "model"
          ? "AI creative brief generated and validated successfully"
          : "Creative brief generated using deterministic producer"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerate() {
    handleGenerate();
  }

  function toggleTool(tool: string) {
    if (!form) return;
    setForm({
      ...form,
      recommendedTools: form.recommendedTools.includes(tool)
        ? form.recommendedTools.filter((t) => t !== tool)
        : [...form.recommendedTools, tool],
    });
  }

  function addCustomTool() {
    if (!form || !toolInput.trim()) return;
    if (!form.recommendedTools.includes(toolInput.trim())) {
      setForm({ ...form, recommendedTools: [...form.recommendedTools, toolInput.trim()] });
    }
    setToolInput("");
  }

  function toggleSkill(skill: string) {
    if (!form) return;
    setForm({
      ...form,
      requiredSkills: form.requiredSkills.includes(skill)
        ? form.requiredSkills.filter((s) => s !== skill)
        : [...form.requiredSkills, skill],
    });
  }

  function addCustomSkill() {
    if (!form || !skillInput.trim()) return;
    if (!form.requiredSkills.includes(skillInput.trim())) {
      setForm({ ...form, requiredSkills: [...form.requiredSkills, skillInput.trim()] });
    }
    setSkillInput("");
  }

  function addDeliverable() {
    if (!form || !deliverableInput.trim()) return;
    setForm({
      ...form,
      deliverables: [...form.deliverables, deliverableInput.trim()],
    });
    setDeliverableInput("");
  }

  function removeDeliverable(idx: number) {
    if (!form) return;
    setForm({
      ...form,
      deliverables: form.deliverables.filter((_, i) => i !== idx),
    });
  }

  async function handleSaveBrief() {
    if (!form) return;
    if (!user) {
      toast.error("Please sign in or join as a brand to save creative briefs");
      navigate("/login");
      return;
    }
    if (user.role !== "BRAND") {
      toast.error("Brand account required to save creative briefs");
      return;
    }

    setSaving(true);
    try {
      const data = await api<{ brief: { id: string } }>("/api/briefs", {
        method: "POST",
        body: JSON.stringify({
          title: form.campaignTitle,
          description: form.description || idea,
          contentType: form.contentType,
          style: form.style,
          targetAudience: form.targetAudience,
          platform: form.platform,
          aspectRatio: form.aspectRatio,
          duration: form.duration,
          requiredTools: form.recommendedTools,
          requiredSkills: form.requiredSkills,
          commercialUse: form.commercialUse,
          deliverables: form.deliverables,
          creativeDirection: form.creativeDirection,
          budget,
          deadline: deadline || null,
        }),
      });

      toast.success("Creative brief saved successfully! Connecting to matching creators...");
      navigate(`/briefs/${data.brief.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save brief");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-ink/8 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            CreatorHub AI
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Backend AI Engine
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          AI-Assisted Brief Builder
        </h1>
        <p className="mt-1 text-xs text-ink/65 sm:text-sm">
          Enter a rough campaign idea in plain language. The AI service extracts and validates 12 structured fields into an editable production brief.
        </p>
      </div>

      {/* ── Step 1: Rough Idea Input Card ──────────────────────────────────── */}
      <Card className="p-6 space-y-4 border border-ink/10 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-ink uppercase tracking-wider">
            Enter Your Rough Campaign Idea
          </label>
          {source && (
            <span className="text-[11px] text-ink/50">
              Source: {source === "model" ? "OpenAI Model" : "Deterministic Fallback Producer"}
            </span>
          )}
        </div>

        <Textarea
          rows={3}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. 'I need a 30 second Instagram advertisement for my sneaker brand.'"
          className="text-sm leading-relaxed"
          disabled={loading}
        />

        {/* Quick Example Pills */}
        <div>
          <span className="text-[11px] font-semibold text-ink/50 block mb-1.5">
            Try example prompts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_IDEAS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setIdea(example)}
                className="rounded-full border border-ink/10 bg-mist px-3 py-1 text-left text-xs text-ink/70 transition hover:border-accent hover:bg-white hover:text-accent shadow-2xs"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-ink/6">
          <span className="text-xs text-ink/50">
            Validates 12 fields (tools, skills, format, deliverables, etc.)
          </span>

          <div className="flex items-center gap-2">
            {form && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={loading}
                className="gap-1.5 text-xs h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            )}

            <Button
              type="button"
              variant="accent"
              onClick={handleGenerate}
              disabled={loading || !idea.trim()}
              className="gap-1.5 text-xs font-bold h-9 px-5 shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading
                ? "Generating & Validating…"
                : form
                ? "Regenerate Brief"
                : "Generate Brief"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Step 2: Editable Generated Brief Form ─────────────────────────── */}
      {form && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Validation Status Banner */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs text-emerald-900">
                  AI Response Validated (12 Structured Fields)
                </p>
                <p className="text-[11px] text-emerald-800/80">
                  All fields have passed schema validation and are ready to edit and save.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegenerate}
                disabled={loading}
                className="h-8 gap-1 text-xs bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100"
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </Button>

              <Button
                size="sm"
                variant="accent"
                onClick={handleSaveBrief}
                disabled={saving}
                className="h-8 gap-1.5 text-xs font-bold px-4"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save Brief"}
              </Button>
            </div>
          </div>

          {/* Form Section 1: Campaign Overview */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/8 pb-2">
              <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Edit3 className="h-4 w-4 text-accent" />
                1. Campaign Title & Core Narrative
              </h2>
              <span className="text-[11px] font-semibold text-accent">Editable</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">
                Campaign Title *
              </label>
              <Input
                value={form.campaignTitle}
                onChange={(e) => setForm({ ...form, campaignTitle: e.target.value })}
                className="font-semibold text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">
                Description & Brief Context
              </label>
              <Textarea
                rows={3}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">
                Creative Direction & Aesthetic *
              </label>
              <Textarea
                rows={3}
                value={form.creativeDirection}
                onChange={(e) => setForm({ ...form, creativeDirection: e.target.value })}
                className="text-xs"
                required
              />
            </div>
          </Card>

          {/* Form Section 2: Format, Duration & Platform */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/8 pb-2">
              <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Film className="h-4 w-4 text-accent" />
                2. Format, Aspect Ratio & Specifications
              </h2>
              <span className="text-[11px] font-semibold text-accent">Editable</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">
                  Content Type *
                </label>
                <select
                  value={form.contentType}
                  onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                  className="h-10 w-full rounded-2xl border border-ink/10 bg-white px-3 text-xs text-ink focus:border-accent focus:outline-none"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="AI Product Video">AI Product Video</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">Style *</label>
                <Input
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">Platform *</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="h-10 w-full rounded-2xl border border-ink/10 bg-white px-3 text-xs text-ink focus:border-accent focus:outline-none"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Omnichannel">Omnichannel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">Aspect Ratio *</label>
                <select
                  value={form.aspectRatio}
                  onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
                  className="h-10 w-full rounded-2xl border border-ink/10 bg-white px-3 text-xs text-ink focus:border-accent focus:outline-none"
                >
                  <option value="9:16">9:16 (Vertical)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Portrait)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">Duration *</label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">Target Audience *</label>
                <Input
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Form Section 3: Required Skills & Tools */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/8 pb-2">
              <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-accent" />
                3. Required AI Tools & Skills (Matching Engine Inputs)
              </h2>
              <span className="text-[11px] font-semibold text-accent">Editable Tags</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1.5">
                Recommended AI Tools ({form.recommendedTools.length})
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TOOLS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTool(t)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      form.recommendedTools.includes(t)
                        ? "bg-accent text-white shadow-xs"
                        : "border border-ink/10 bg-mist text-ink/70 hover:bg-white hover:text-ink"
                    }`}
                  >
                    {form.recommendedTools.includes(t) && "✓ "}
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tool..."
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  className="h-8 text-xs max-w-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCustomTool} className="h-8 text-xs">
                  Add Tool
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1.5">
                Required Skills ({form.requiredSkills.length})
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SKILLS.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      form.requiredSkills.includes(sk)
                        ? "bg-accent text-white shadow-xs"
                        : "border border-ink/10 bg-mist text-ink/70 hover:bg-white hover:text-ink"
                    }`}
                  >
                    {form.requiredSkills.includes(sk) && "✓ "}
                    {sk}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="h-8 text-xs max-w-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCustomSkill} className="h-8 text-xs">
                  Add Skill
                </Button>
              </div>
            </div>
          </Card>

          {/* Form Section 4: Deliverables & Commercial Rights */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/8 pb-2">
              <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-accent" />
                4. Deliverables & Commercial Rights
              </h2>
              <span className="text-[11px] font-semibold text-accent">Editable</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1.5">
                Campaign Deliverables Checklist ({form.deliverables.length})
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g. Master 30s cut (4K), 9:16 platform version, 3 social stills"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  className="text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={addDeliverable} className="h-9 text-xs">
                  Add Deliverable
                </Button>
              </div>

              <ul className="space-y-1.5">
                {form.deliverables.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-mist px-3 py-1.5 text-xs text-ink/85"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{item}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDeliverable(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      × Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">
                  Budget / Compensation Range
                </label>
                <Input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. $5,000 – $10,000"
                  className="text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1">
                  Target Deadline
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.commercialUse}
                  onChange={(e) => setForm({ ...form, commercialUse: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <div>
                  <span className="font-semibold text-xs text-ink block">
                    Commercial-Use Clearance Required
                  </span>
                  <span className="text-[11px] text-ink/65">
                    Enforces that all matched creators have cleared commercial rights for brand marketing and advertising deliverables.
                  </span>
                </div>
              </label>
            </div>
          </Card>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-3xl border border-ink/15 bg-white/95 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-ink/60">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Ready to save and discover matching creators</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={loading}
                className="gap-1.5 text-xs h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>

              <Button
                type="button"
                variant="accent"
                onClick={handleSaveBrief}
                disabled={saving}
                className="gap-2 text-xs font-bold h-9 px-6 shadow-xs"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving Brief…" : "Save Brief"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
