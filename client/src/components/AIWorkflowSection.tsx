import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Lightbulb,
  Terminal,
  Sparkles,
  Sliders,
  CheckCircle2,
  ArrowDown,
  Layers,
  ShieldCheck,
  Cpu,
  Wrench,
  Award,
  ChevronDown,
  Edit3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface WorkflowStep {
  stage: string;
  description: string;
  iconName: string;
}

export const CANONICAL_STAGES = [
  {
    stage: "Research",
    iconName: "Search",
    fallback: "Competitive visual benchmarking, brand asset audit, lighting references, and shot moodboarding.",
  },
  {
    stage: "Concept",
    iconName: "Lightbulb",
    fallback: "Creative treatment, visual bible development, storyboard architecture, and hero frame look-development.",
  },
  {
    stage: "Prompting",
    iconName: "Terminal",
    fallback: "Iterative prompt syntax, negative token constraints, LoRA weights, and seed exploration.",
  },
  {
    stage: "AI Generation",
    iconName: "Sparkles",
    fallback: "High-resolution generative synthesis, text-to-video camera control, and multi-angle scene generation.",
  },
  {
    stage: "Editing",
    iconName: "Sliders",
    fallback: "Neural upscaling, frame interpolation, editorial cut, sound design, and color grading in DaVinci.",
  },
  {
    stage: "Final Delivery",
    iconName: "CheckCircle2",
    fallback: "Master deliverables in required aspect ratios (16:9, 9:16), clean plates, and commercial rights documentation.",
  },
];

export function parseWorkflowSteps(rawText?: string): WorkflowStep[] {
  if (!rawText || !rawText.trim()) {
    return CANONICAL_STAGES.map((s) => ({
      stage: s.stage,
      description: s.fallback,
      iconName: s.iconName,
    }));
  }

  const text = rawText.trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Check if text has numbered or named stage lines (e.g. "1. Research: ...", "Research: ...", "Stage 1: Research - ...")
  const stageRegex = /^(?:\d+[\.\)]\s*)?(?:Stage\s*\d+[:\-–—]\s*)?([A-Za-z\s]+)[:\-–—]\s*(.+)$/i;

  const parsedFromLines: { stage: string; description: string }[] = [];
  for (const line of lines) {
    const match = line.match(stageRegex);
    if (match) {
      parsedFromLines.push({
        stage: match[1].trim(),
        description: match[2].trim(),
      });
    }
  }

  if (parsedFromLines.length >= 3) {
    return parsedFromLines.map((p, idx) => {
      const canonical =
        CANONICAL_STAGES.find((c) => c.stage.toLowerCase() === p.stage.toLowerCase()) ||
        CANONICAL_STAGES[idx] ||
        CANONICAL_STAGES[CANONICAL_STAGES.length - 1];
      return {
        stage: p.stage,
        description: p.description,
        iconName: canonical.iconName,
      };
    });
  }

  // Check if text has arrow separators: "→", "->", "=>", "↓"
  const arrowParts = text.split(/\s*(?:→|->|=>|↓)\s*/).filter(Boolean);
  if (arrowParts.length >= 2) {
    if (arrowParts.length === CANONICAL_STAGES.length) {
      return CANONICAL_STAGES.map((s, idx) => ({
        stage: s.stage,
        description: arrowParts[idx],
        iconName: s.iconName,
      }));
    } else {
      return arrowParts.map((part, idx) => {
        const canonical = CANONICAL_STAGES[Math.min(idx, CANONICAL_STAGES.length - 1)];
        const partMatch = part.match(/^([A-Za-z\s]+)[:\-–—]\s*(.+)$/);
        return {
          stage: partMatch ? partMatch[1].trim() : canonical.stage,
          description: partMatch ? partMatch[2].trim() : part,
          iconName: canonical.iconName,
        };
      });
    }
  }

  // If single paragraph or short summary, assign to AI Generation and keep canonical fallbacks
  return CANONICAL_STAGES.map((s, idx) => {
    let desc = s.fallback;
    if (idx === 3 || (idx === 0 && text.length > 50)) {
      desc = text;
    }
    return {
      stage: s.stage,
      description: desc,
      iconName: s.iconName,
    };
  });
}

function renderStageIcon(iconName: string, className = "h-4 w-4") {
  switch (iconName) {
    case "Search":
      return <Search className={className} />;
    case "Lightbulb":
      return <Lightbulb className={className} />;
    case "Terminal":
      return <Terminal className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Sliders":
      return <Sliders className={className} />;
    case "CheckCircle2":
      return <CheckCircle2 className={className} />;
    default:
      return <Layers className={className} />;
  }
}

interface AIWorkflowSectionProps {
  workflowText?: string;
  toolsUsed?: string[];
  aiModelsUsed?: string[];
  skills?: string[];
  commercialUse?: boolean;
  commercialNotes?: string;
  projectId?: string;
  isOwner?: boolean;
}

export function AIWorkflowSection({
  workflowText,
  toolsUsed = [],
  aiModelsUsed = [],
  skills = [],
  commercialUse = true,
  commercialNotes = "",
  projectId,
  isOwner = false,
}: AIWorkflowSectionProps) {
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const steps = parseWorkflowSteps(workflowText);

  return (
    <Card className="overflow-hidden border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 border-b border-ink/5 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-100 text-accent">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="font-display text-2xl text-ink">AI Production Workflow</h2>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800">
              {steps.length} Stages
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            End-to-end creative and technical pipeline documented by creator
          </p>
        </div>

        {isOwner && projectId && (
          <Button size="sm" variant="outline" asChild className="text-xs">
            <Link to={`/creator/portfolio?edit=${projectId}`} className="flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              Edit Workflow
            </Link>
          </Button>
        )}
      </div>

      {/* ── Visual Flow Bar (Quick Visual Sequence) ────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-ink/5 bg-mist/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
          Workflow Pipeline Sequence
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {steps.map((step, idx) => (
            <div key={step.stage + idx} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStepIndex(activeStepIndex === idx ? null : idx)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  activeStepIndex === idx
                    ? "border-accent bg-accent text-white shadow-sm"
                    : "border-ink/10 bg-white text-ink hover:border-accent/40 hover:bg-violet-50/50"
                }`}
              >
                <span className="opacity-75">{renderStageIcon(step.iconName, "h-3.5 w-3.5")}</span>
                <span>{step.stage}</span>
              </button>
              {idx < steps.length - 1 && (
                <span className="flex items-center text-ink/40 font-bold" title="leads to">
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed Step-by-Step Flow with Downward Arrows (↓) ────────────── */}
      <div className="mt-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
          Stage-by-Stage Methodology
        </p>

        <div className="relative space-y-0 pl-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isSelected = activeStepIndex === idx;

            return (
              <div key={step.stage + idx} className="group relative">
                {/* Step Row */}
                <div
                  onClick={() => setActiveStepIndex(isSelected ? null : idx)}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition ${
                    isSelected
                      ? "border-accent bg-violet-50/40 shadow-sm"
                      : "border-ink/8 bg-white hover:border-ink/20 hover:bg-mist/30"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Stage Number Badge */}
                    <div
                      className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl font-mono text-xs font-bold transition ${
                        isSelected
                          ? "bg-accent text-white shadow-sm"
                          : "bg-violet-50 text-accent group-hover:bg-violet-100"
                      }`}
                    >
                      {renderStageIcon(step.iconName, "h-5 w-5")}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-accent">
                            STEP 0{idx + 1}
                          </span>
                          <h3 className="font-display text-lg text-ink group-hover:text-accent">
                            {step.stage}
                          </h3>
                        </div>
                        <span className="rounded-full bg-mist px-2.5 py-0.5 text-[10px] font-medium text-ink/60">
                          Phase {idx + 1} of {steps.length}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-ink/75 sm:text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Downward Connector Arrow (↓) between steps */}
                {!isLast && (
                  <div className="my-1.5 flex items-center justify-center">
                    <div className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-mist px-2 py-0.5 text-[11px] font-bold text-accent shadow-2xs">
                      <ArrowDown className="h-3 w-3" />
                      <span className="text-[10px] uppercase tracking-wider text-ink/50">Next Stage</span>
                      <span className="text-xs">↓</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Production Specs Matrix: AI Tools, Models, Skills & Commercial ─── */}
      <div className="mt-10 border-t border-ink/8 pt-8">
        <h3 className="font-display text-xl text-ink">Production Stack & Specifications</h3>
        <p className="mt-0.5 text-xs text-ink/50">
          Hardware, models, and generative tooling verified for this project
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* 1. AI Tools */}
          <div className="rounded-2xl border border-ink/8 bg-mist/40 p-4.5">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-accent" />
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                AI Production Tools
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {toolsUsed && toolsUsed.length > 0 ? (
                toolsUsed.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-xl border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink shadow-2xs"
                  >
                    {tool}
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink/50">Runway, Midjourney, DaVinci</span>
              )}
            </div>
          </div>

          {/* 2. Generative Models */}
          <div className="rounded-2xl border border-ink/8 bg-mist/40 p-4.5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Foundation AI Models
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {aiModelsUsed && aiModelsUsed.length > 0 ? (
                aiModelsUsed.map((model) => (
                  <span
                    key={model}
                    className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800"
                  >
                    {model}
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink/50">Runway Gen-3 Alpha, Sora</span>
              )}
            </div>
          </div>

          {/* 3. Applied Creative Skills */}
          <div className="rounded-2xl border border-ink/8 bg-mist/40 p-4.5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                Applied Creative Skills
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills && skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1 text-xs font-medium text-amber-900"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink/50">Prompt Art Direction, Neural Upscaling</span>
              )}
            </div>
          </div>

          {/* 4. Commercial-Use & Licensing */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                Commercial-Use & IP Rights
              </p>
            </div>
            <div className="mt-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {commercialUse
                    ? "Cleared for Full Commercial Brand Campaigns"
                    : "Personal Concept / Editorial Project Only"}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-emerald-950/80">
                {commercialNotes ||
                  (commercialUse
                    ? "Full commercial licensing rights transfer upon project delivery. Cleared for paid media, social ads, and broadcast."
                    : "Created as an experimental concept showcase or editorial study.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
