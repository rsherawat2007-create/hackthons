import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Film,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Ratio,
  Building,
  Image as ImageIcon,
  Save,
  X,
  Eye,
  Loader2,
  Star,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { CONTENT_TYPES, SPECIALIZATIONS, TOOLS, SKILLS, type PortfolioItem } from "@/types";
import { parseWorkflowSteps } from "@/components/AIWorkflowSection";

const blankForm = {
  title: "",
  description: "",
  mediaUrl: "",
  thumbnailUrl: "",
  contentType: "AI Video",
  category: "Product Advertisement",
  industry: "Footwear & Apparel",
  toolsUsed: ["Runway", "Midjourney"],
  aiModelsUsed: ["Runway Gen-3 Alpha"],
  skills: ["AI Video Direction", "Prompt Art Direction"],
  aspectRatio: "16:9",
  commercialUse: true,
  commercialNotes: "Full IP transfer upon delivery. Cleared for paid social, OOH, and broadcast.",
  date: new Date().toISOString().slice(0, 10),
  workflow:
    "1. Research: Visual benchmarking, brand audit, and lighting references\n2. Concept: Styleframes, color palette, and storyboard architecture\n3. Prompting: Iterative negative constraints, LoRA weights, and seed look-dev\n4. AI Generation: Text-to-video motion synthesis in Runway Gen-3\n5. Editing: Editorial cut, 4K neural upscaling, and DaVinci color grade\n6. Final Delivery: Master delivery in 16:9 / 9:16 with verified commercial clearance",
};

export function PortfolioManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState(blankForm.title);
  const [description, setDescription] = useState(blankForm.description);
  const [mediaUrl, setMediaUrl] = useState(blankForm.mediaUrl);
  const [thumbnailUrl, setThumbnailUrl] = useState(blankForm.thumbnailUrl);
  const [contentType, setContentType] = useState(blankForm.contentType);
  const [category, setCategory] = useState(blankForm.category);
  const [industry, setIndustry] = useState(blankForm.industry);
  const [toolsUsed, setToolsUsed] = useState<string[]>(blankForm.toolsUsed);
  const [aiModelsUsed, setAiModelsUsed] = useState<string[]>(blankForm.aiModelsUsed);
  const [skills, setSkills] = useState<string[]>(blankForm.skills);
  const [aspectRatio, setAspectRatio] = useState(blankForm.aspectRatio);
  const [commercialUse, setCommercialUse] = useState(blankForm.commercialUse);
  const [commercialNotes, setCommercialNotes] = useState(blankForm.commercialNotes);
  const [date, setDate] = useState(blankForm.date);
  const [workflow, setWorkflow] = useState(blankForm.workflow);
  const [isFeatured, setIsFeatured] = useState(false);

  // Custom Tag Inputs
  const [customTool, setCustomTool] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const creatorId = user?.creatorProfile?.id;

  async function loadPortfolio() {
    if (!creatorId) return;
    setLoading(true);
    try {
      const res = await api<{ portfolio: PortfolioItem[] }>(`/api/portfolio/${creatorId}`);
      setItems(res.portfolio || []);
    } catch (err) {
      toast.error("Failed to load portfolio items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, [creatorId]);

  // Handle URL edit parameter
  useEffect(() => {
    if (editId && items.length > 0) {
      const target = items.find((i) => i.id === editId);
      if (target) {
        startEdit(target);
      }
    }
  }, [editId, items]);

  function resetForm() {
    setTitle(blankForm.title);
    setDescription(blankForm.description);
    setMediaUrl(blankForm.mediaUrl);
    setThumbnailUrl(blankForm.thumbnailUrl);
    setContentType(blankForm.contentType);
    setCategory(blankForm.category);
    setIndustry(blankForm.industry);
    setToolsUsed(blankForm.toolsUsed);
    setAiModelsUsed(blankForm.aiModelsUsed);
    setSkills(blankForm.skills);
    setAspectRatio(blankForm.aspectRatio);
    setCommercialUse(blankForm.commercialUse);
    setCommercialNotes(blankForm.commercialNotes);
    setDate(new Date().toISOString().slice(0, 10));
    setWorkflow(blankForm.workflow);
    setIsFeatured(false);
    setEditingItem(null);
  }

  function startAdd() {
    resetForm();
    setIsFormOpen(true);
  }

  function startEdit(item: PortfolioItem) {
    setEditingItem(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setMediaUrl(item.mediaUrl || "");
    setThumbnailUrl(item.thumbnailUrl || "");
    setContentType(item.contentType || "AI Video");
    setCategory(item.category || "Product Advertisement");
    setIndustry(item.industry || "General");
    setToolsUsed(item.toolsUsed || []);
    setAiModelsUsed(item.aiModelsUsed || []);
    setSkills(item.skills || []);
    setAspectRatio(item.aspectRatio || "16:9");
    setCommercialUse(Boolean(item.commercialUse ?? true));
    setCommercialNotes(item.commercialNotes || "");
    setDate(item.date ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setWorkflow(item.workflow || "");
    setIsFeatured(Boolean(item.isFeatured));
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingItem(null);
    if (searchParams.has("edit")) {
      searchParams.delete("edit");
      setSearchParams(searchParams);
    }
  }

  // Tag helpers
  function toggleTag(current: string[], val: string, setter: (v: string[]) => void) {
    if (current.includes(val)) {
      setter(current.filter((x) => x !== val));
    } else {
      setter([...current, val]);
    }
  }

  function addTag(val: string, current: string[], setter: (v: string[]) => void, clear: () => void) {
    const clean = val.trim();
    if (!clean) return;
    if (!current.includes(clean)) {
      setter([...current, clean]);
    }
    clear();
  }

  function handleInsertPipelineTemplate() {
    const tools = toolsUsed.length > 0 ? toolsUsed.slice(0, 2).join(" & ") : "Runway & Midjourney";
    const models = aiModelsUsed.length > 0 ? aiModelsUsed.join(", ") : "Runway Gen-3 Alpha";
    setWorkflow(
      `1. Research: Competitive aesthetic analysis, moodboards, and shot lighting references\n2. Concept: Creative treatment, styleframes, and scene storyboard architecture\n3. Prompting: Negative prompt engineering, seed testing, and prompt weights in ${tools}\n4. AI Generation: High-fidelity generative motion and plate synthesis with ${models}\n5. Editing: Frame interpolation, neural upscaling, sound design, and color grading in DaVinci\n6. Final Delivery: Multi-format master outputs (16:9, 9:16) with commercial IP assignment documentation`
    );
    toast.success("Loaded 6-stage AI workflow template!");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !mediaUrl.trim() || !thumbnailUrl.trim()) {
      toast.error("Please fill in Title, Description, Media URL, and Thumbnail URL");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        mediaUrl: mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        contentType,
        category,
        industry: industry.trim(),
        toolsUsed,
        aiModelsUsed,
        skills,
        aspectRatio,
        commercialUse,
        commercialNotes: commercialNotes.trim(),
        date,
        workflow: workflow.trim(),
        isFeatured,
      };

      if (editingItem) {
        // UPDATE existing project
        await api(`/api/portfolio/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Project updated successfully!");
      } else {
        // CREATE new project
        await api("/api/portfolio", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Project added to portfolio!");
      }

      closeForm();
      loadPortfolio();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save portfolio project");
    } finally {
      setSubmitting(false);
    }
  }

  const featuredItems = items
    .filter((i) => i.isFeatured)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
  const libraryItems = items.filter((i) => !i.isFeatured);

  async function handleToggleFeature(item: PortfolioItem) {
    const isCurrentlyFeatured = Boolean(item.isFeatured);
    if (!isCurrentlyFeatured && featuredItems.length >= 6) {
      toast.error("You can feature a maximum of 6 projects as Best Work. Please remove one first.");
      return;
    }

    try {
      const res = await api<{ item: PortfolioItem }>(`/api/portfolio/${item.id}/feature`, {
        method: "PUT",
        body: JSON.stringify({ isFeatured: !isCurrentlyFeatured }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, isFeatured: res.item.isFeatured, featuredOrder: res.item.featuredOrder }
            : i
        )
      );
      toast.success(
        !isCurrentlyFeatured
          ? `Marked "${item.title}" as Best Work!`
          : `Removed "${item.title}" from Best Work`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle Best Work status");
    }
  }

  async function handleMoveFeatured(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featuredItems.length) return;

    const reordered = [...featuredItems];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      const orderedIds = reordered.map((i) => i.id);
      const res = await api<{ portfolio: PortfolioItem[] }>("/api/portfolio/reorder-featured", {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      });
      setItems(res.portfolio || []);
      toast.success("Best Work order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder Best Work");
    }
  }

  async function handleDelete(id: string, itemTitle: string) {
    if (!confirm(`Are you sure you want to delete "${itemTitle}" from your portfolio?`)) return;
    try {
      await api(`/api/portfolio/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 border-b border-ink/5 pb-6 sm:flex-row sm:items-center">
        <div>
          <Link
            to={creatorId ? `/creators/${creatorId}` : "/dashboard/creator"}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Profile
          </Link>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Portfolio Studio</h1>
          <p className="mt-1 text-xs text-ink/60 sm:text-sm">
            Publish and manage client deliverables, AI commercial case studies, and cinematic tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {creatorId && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/creators/${creatorId}`} target="_blank" className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                View Public Showcase
              </Link>
            </Button>
          )}

          <Button variant="accent" size="default" onClick={startAdd} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add New Project
          </Button>
        </div>
      </div>

      {/* ── Project Creation / Edit Drawer or Modal ───────────────────────── */}
      {isFormOpen && (
        <Card className="my-8 border-2 border-accent/20 bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center justify-between border-b border-ink/5 pb-4">
            <div>
              <h2 className="font-display text-2xl text-ink">
                {editingItem ? "Edit Portfolio Project" : "Add Project to Portfolio"}
              </h2>
              <p className="mt-0.5 text-xs text-ink/50">
                Provide comprehensive generative stack specifications to boost your discovery ranking.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl p-2 text-ink/40 hover:bg-mist hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* 1. Basic Project Identity */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Apex Night Sprint — Premium Sneaker Film"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Media URL (Video .mp4 or High-Res Image) <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="https://images.unsplash.com/... or https://...video.mp4"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Thumbnail URL <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Project Description & Creative Brief <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder="Describe the campaign objective, artistic direction, client brief, and how you solved the visual challenge with generative AI..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24"
                  required
                />
              </div>
            </div>

            {/* 2. Taxonomy & Categorization */}
            <div className="grid gap-4 border-t border-ink/5 pt-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-accent"
                >
                  {CONTENT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Category / Specialization
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-accent"
                >
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="16:9">16:9 (Horizontal / Landscape)</option>
                  <option value="9:16">9:16 (Vertical / Reels / TikTok)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Portrait Feed)</option>
                  <option value="21:9">21:9 (Cinematic Anamorphic)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Target Industry
                </label>
                <Input
                  placeholder="e.g. Footwear & Athletics, Beauty, Automotive"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Completion Date
                </label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commercialUse}
                    onChange={(e) => setCommercialUse(e.target.checked)}
                    className="h-4 w-4 rounded text-accent focus:ring-accent"
                  />
                  Commercial Campaign Cleared
                </label>
              </div>
            </div>

            {/* 3. AI Stack: Tools, Models & Applied Skills */}
            <div className="space-y-4 border-t border-ink/5 pt-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  AI Tools & Software Used
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TOOLS.map((t) => {
                    const active = toolsUsed.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(toolsUsed, t, setToolsUsed)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? "border-accent bg-accent text-white"
                            : "border-ink/10 bg-white text-ink/70 hover:border-accent/40"
                        }`}
                      >
                        {active ? `✓ ${t}` : `+ ${t}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Generative Models
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Runway Gen-3 Alpha", "Midjourney v6.1", "Sora", "Flux.1 Dev", "Kling 1.5", "Stable Diffusion XL"].map((m) => {
                    const active = aiModelsUsed.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleTag(aiModelsUsed, m, setAiModelsUsed)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-ink/10 bg-white text-ink/70 hover:border-violet-400"
                        }`}
                      >
                        {active ? `✓ ${m}` : `+ ${m}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Creative Skills Applied
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((s) => {
                    const active = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleTag(skills, s, setSkills)}
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
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
            </div>

            {/* 4. Workflow & Commercial Notes */}
            <div className="space-y-4 border-t border-ink/5 pt-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span>AI Production Workflow (6-Stage Pipeline)</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/60">
                      Standard flow: Research ↓ Concept ↓ Prompting ↓ AI Generation ↓ Editing ↓ Final Delivery
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleInsertPipelineTemplate}
                    className="h-8 border-violet-200 bg-white text-xs text-accent hover:bg-violet-50"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Load 6-Stage Template
                  </Button>
                </div>

                <div className="mt-3">
                  <Textarea
                    placeholder="Document your pipeline stages (e.g. 1. Research: ... 2. Concept: ... 3. Prompting: ... 4. AI Generation: ... 5. Editing: ... 6. Final Delivery: ...)"
                    value={workflow}
                    onChange={(e) => setWorkflow(e.target.value)}
                    className="min-h-28 bg-white font-mono text-xs leading-relaxed"
                  />
                </div>

                {/* Live Visual Flow Preview */}
                <div className="mt-3 rounded-xl border border-ink/5 bg-white p-3 shadow-2xs">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                    Live Visual Flow Preview
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    {parseWorkflowSteps(workflow).map((s, idx, arr) => (
                      <span key={s.stage + idx} className="flex items-center gap-1.5">
                        <span className="rounded-lg border border-ink/10 bg-mist px-2.5 py-1 text-xs font-semibold text-ink">
                          {s.stage}
                        </span>
                        {idx < arr.length - 1 && (
                          <span className="font-bold text-accent" title="leads to">
                            ↓
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                  Commercial Rights & Licensing Notes
                </label>
                <Textarea
                  placeholder="Specify model licensing, brand clearances, IP buyout terms, and media format deliverables..."
                  value={commercialNotes}
                  onChange={(e) => setCommercialNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>
            </div>

            {/* 5. Best Work / Featured Toggle */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => {
                    const willFeature = e.target.checked;
                    const count = items.filter((i) => i.isFeatured && i.id !== editingItem?.id).length;
                    if (willFeature && count >= 6) {
                      toast.error("You can feature a maximum of 6 projects as Best Work. Please remove one first.");
                      return;
                    }
                    setIsFeatured(willFeature);
                  }}
                  className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span>Feature as Best Work</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Spotlight on Profile
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/65">
                    Spotlight this project near the top of your public creator profile. You can feature up to 6 key projects.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 border-t border-ink/5 pt-4">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Project…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingItem ? "Update Project" : "Publish Project"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Section 1: Best Work Spotlight (Featured Projects) ──────────────── */}
      <div className="mt-8">
        <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500" />
            </div>
            <h2 className="font-display text-2xl text-ink">
              Best Work Spotlight
            </h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {featuredItems.length}/6 Featured
            </span>
          </div>
          <p className="text-xs text-ink/50">
            Prominently shown near the top of your creator profile · Reorder using arrows
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[16vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : featuredItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredItems.map((item, index) => (
              <Card
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
              >
                {/* Thumbnail / Media banner */}
                <div className="relative aspect-video w-full overflow-hidden bg-mist">
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      <Star className="h-3 w-3 fill-white" />
                      #{index + 1} Best Work
                    </span>
                    <span className="rounded-full bg-ink/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {item.contentType}
                    </span>
                  </div>

                  {/* Reorder Arrow Controls Overlay */}
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveFeatured(index, "up")}
                      title="Move up in Best Work order"
                      className="rounded p-1 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === featuredItems.length - 1}
                      onClick={() => handleMoveFeatured(index, "down")}
                      title="Move down in Best Work order"
                      className="rounded p-1 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                      {item.category || "Featured Case Study"}
                      {item.industry ? ` · ${item.industry}` : ""}
                    </p>

                    <h3 className="mt-1 font-display text-lg text-ink group-hover:text-accent">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink/60">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.toolsUsed?.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-100"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 flex items-center justify-between border-t border-ink/5 pt-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" asChild className="h-8 px-2 text-xs text-accent">
                        <Link to={`/portfolio/${item.id}`}>
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFeature(item)}
                        className="h-8 border-amber-300 bg-amber-50/50 px-2.5 text-xs text-amber-800 hover:bg-amber-100"
                        title="Remove from Best Work"
                      >
                        <Star className="mr-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Remove
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-amber-200/90 bg-amber-50/20 p-8 text-center">
            <Star className="mx-auto h-8 w-8 text-amber-400" />
            <h3 className="mt-2 font-display text-base text-ink">No projects featured in Best Work yet</h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-ink/60">
              Click the star button on any project in your portfolio library below to spotlight up to 6 top deliverables near the top of your public creator profile.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 2: Portfolio Library (Normal / Remaining Portfolio) ────── */}
      <div className="mt-12 border-t border-ink/5 pt-8">
        <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl text-ink">
              Portfolio Library ({libraryItems.length})
            </h2>
            <p className="text-xs text-ink/50">
              Standard client deliverables and case studies in your general portfolio
            </p>
          </div>
          <span className="text-xs text-ink/40">
            {featuredItems.length} featured as Best Work above · {items.length} total works
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : libraryItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {libraryItems.map((item) => (
              <Card
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white transition hover:-translate-y-1 hover:shadow-card"
              >
                {/* Thumbnail / Media banner */}
                <div className="relative aspect-video w-full overflow-hidden bg-mist">
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-ink/75 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {item.contentType}
                    </span>
                    {item.aspectRatio && (
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                        {item.aspectRatio}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                      {item.category || "AI Creative"}
                      {item.industry ? ` · ${item.industry}` : ""}
                    </p>

                    <h3 className="mt-1 font-display text-lg text-ink group-hover:text-accent">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink/60">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.toolsUsed?.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-ink/5 pt-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" asChild className="h-8 px-2 text-xs text-accent">
                        <Link to={`/portfolio/${item.id}`}>
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFeature(item)}
                        className="h-8 px-2.5 text-xs text-amber-800 hover:bg-amber-50"
                        title="Add to Best Work (max 6)"
                      >
                        <Star className="mr-1 h-3.5 w-3.5 text-amber-500" />
                        Feature
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/10 p-8 text-center text-xs text-ink/50">
            All {featuredItems.length} of your portfolio works are currently showcased in your Best Work Spotlight above.
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-ink/10 p-12 text-center">
            <Film className="mx-auto h-12 w-12 text-ink/20" />
            <h3 className="mt-3 font-display text-xl text-ink">No projects in your portfolio yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-ink/50">
              Showcase your commercial campaigns and AI look-development to get shortlisted by leading brands.
            </p>
            <Button variant="accent" className="mt-5" onClick={startAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Your First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
