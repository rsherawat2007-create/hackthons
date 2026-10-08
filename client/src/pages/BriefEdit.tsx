import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/services/api";
import { TOOLS, SKILLS, CONTENT_TYPES } from "@/types";
import type { Brief } from "@/types";

export function BriefEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    contentType: "AI Video",
    style: "",
    targetAudience: "",
    platform: "Instagram",
    aspectRatio: "9:16",
    duration: "30 seconds",
    requiredTools: [] as string[],
    requiredSkills: [] as string[],
    commercialUse: true,
    deadline: "",
    budget: "",
    deliverables: [] as string[],
    creativeDirection: "",
  });

  const [toolInput, setToolInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");

  useEffect(() => {
    api<{ brief: Brief }>(`/api/briefs/${id}`)
      .then((d) => {
        const b = d.brief;
        setForm({
          title: b.title,
          description: b.description,
          contentType: b.contentType || "AI Video",
          style: b.style || "",
          targetAudience: b.targetAudience || "",
          platform: b.platform || "Instagram",
          aspectRatio: b.aspectRatio || "9:16",
          duration: b.duration || "30 seconds",
          requiredTools: b.requiredTools || [],
          requiredSkills: b.requiredSkills || [],
          commercialUse: b.commercialUse ?? true,
          deadline: b.deadline ? b.deadline.slice(0, 10) : "",
          budget: b.budget || "",
          deliverables: b.deliverables || [],
          creativeDirection: b.creativeDirection || "",
        });
      })
      .catch((e) => {
        toast.error("Could not load brief");
        navigate("/briefs");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function toggleTool(tool: string) {
    setForm((prev) => ({
      ...prev,
      requiredTools: prev.requiredTools.includes(tool)
        ? prev.requiredTools.filter((t) => t !== tool)
        : [...prev.requiredTools, tool],
    }));
  }

  function addCustomTool() {
    if (!toolInput.trim()) return;
    if (!form.requiredTools.includes(toolInput.trim())) {
      setForm((prev) => ({ ...prev, requiredTools: [...prev.requiredTools, toolInput.trim()] }));
    }
    setToolInput("");
  }

  function toggleSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  }

  function addCustomSkill() {
    if (!skillInput.trim()) return;
    if (!form.requiredSkills.includes(skillInput.trim())) {
      setForm((prev) => ({ ...prev, requiredSkills: [...prev.requiredSkills, skillInput.trim()] }));
    }
    setSkillInput("");
  }

  function addDeliverable() {
    if (!deliverableInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, deliverableInput.trim()],
    }));
    setDeliverableInput("");
  }

  function removeDeliverable(index: number) {
    setForm((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Campaign title is required");
    if (!form.description.trim()) return toast.error("Description is required");

    setSaving(true);
    try {
      await api(`/api/briefs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          deadline: form.deadline ? form.deadline : null,
        }),
      });
      toast.success("Brief updated successfully");
      navigate(`/briefs/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update brief");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this creative brief? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api(`/api/briefs/${id}`, { method: "DELETE" });
      toast.success("Brief deleted successfully");
      navigate("/briefs");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete brief");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-xl bg-violet-100" />
        <div className="h-96 rounded-3xl bg-violet-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            to={`/briefs/${id}`}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to brief
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl">Edit Creative Brief</h1>
          <p className="mt-1 text-xs text-ink/60 sm:text-sm">
            Update campaign parameters, required tools, skills, deliverables, and matching requirements.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-9"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {deleting ? "Deleting…" : "Delete Brief"}
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Section 1: Campaign Core */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-ink border-b border-ink/8 pb-2">
            1. Campaign Overview
          </h2>
          <div>
            <label className="block text-xs font-semibold text-ink/75 mb-1">
              Campaign Title *
            </label>
            <Input
              placeholder="e.g. Autumn Haute Couture Runway Film"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/75 mb-1">
              Description & Objectives *
            </label>
            <Textarea
              rows={4}
              placeholder="Detailed description of the campaign, story concept, visual requirements..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/75 mb-1">
              Creative Direction
            </label>
            <Textarea
              rows={3}
              placeholder="Lighting style, camera movement, aesthetic notes, look-and-feel..."
              value={form.creativeDirection}
              onChange={(e) => setForm({ ...form, creativeDirection: e.target.value })}
            />
          </div>
        </Card>

        {/* Section 2: Format & Specifications */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-ink border-b border-ink/8 pb-2">
            2. Format & Specifications
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Content Type</label>
              <select
                className="h-10 w-full rounded-2xl border border-ink/10 bg-white px-3 text-xs text-ink focus:border-accent focus:outline-none"
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value })}
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="Custom">Custom Format</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Style</label>
              <Input
                placeholder="e.g. Cinematic, Editorial, Photoreal"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Platform</label>
              <select
                className="h-10 w-full rounded-2xl border border-ink/10 bg-white px-3 text-xs text-ink focus:border-accent focus:outline-none"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              >
                <option value="Instagram">Instagram (Reels / Feed)</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube (16:9 / Shorts)</option>
                <option value="Omnichannel">Omnichannel / Web</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Aspect Ratio</label>
              <select
                className="h-10 w-full rounded-2xl border border-ink/10 bg-white px-3 text-xs text-ink focus:border-accent focus:outline-none"
                value={form.aspectRatio}
                onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
              >
                <option value="9:16">9:16 (Vertical)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Portrait)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Duration</label>
              <Input
                placeholder="e.g. 15s, 30s, 60s"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Target Audience</label>
              <Input
                placeholder="e.g. 18-35 luxury shoppers"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Required AI Tools & Skills */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-ink border-b border-ink/8 pb-2">
            3. Required AI Tools & Creator Skills (Matching Engine Inputs)
          </h2>

          <div>
            <label className="block text-xs font-semibold text-ink/75 mb-1.5">
              Required AI Tools & Models
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TOOLS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTool(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    form.requiredTools.includes(t)
                      ? "bg-accent text-white shadow-xs"
                      : "border border-ink/10 bg-mist text-ink/70 hover:bg-white hover:text-ink"
                  }`}
                >
                  {form.requiredTools.includes(t) && "✓ "}
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add other AI tool (e.g. Flux, DaVinci Resolve)"
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
              Required Skills
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
                placeholder="Add other skill"
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

        {/* Section 4: Budget, Commercial Use & Deliverables */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-ink border-b border-ink/8 pb-2">
            4. Budget, Deliverables & Commercial Rights
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Budget / Compensation</label>
              <Input
                placeholder="e.g. $5,000 – $10,000"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75 mb-1">Campaign Deadline</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/75 mb-1.5">Deliverables</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g. Master 30s cut (4K), 9:16 platform version, 3 social stills"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                className="text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={addDeliverable}>
                Add Deliverable
              </Button>
            </div>
            {form.deliverables.length > 0 && (
              <ul className="space-y-1.5">
                {form.deliverables.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-mist px-3 py-1.5 text-xs text-ink/80"
                  >
                    <span>{item}</span>
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
            )}
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
                  Creators must have verified commercial usage rights for all generated assets and deliverables.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" asChild>
            <Link to={`/briefs/${id}`}>Cancel</Link>
          </Button>

          <Button type="submit" variant="accent" disabled={saving} className="px-6 gap-1.5 font-bold">
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes…" : "Save Brief Updates"}
          </Button>
        </div>
      </form>
    </div>
  );
}
