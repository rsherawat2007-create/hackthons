import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/MatchBadge";
import { SendBriefModal } from "@/components/SendBriefModal";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { Creator, AssistantResponse, ExtractedCriteria } from "@/types";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  criteria?: ExtractedCriteria;
  results?: Creator[];
  totalMatches?: number;
}

const EXAMPLE_PROMPTS = [
  "I need a cinematic AI video creator for a fashion campaign. They should know Runway and support commercial work.",
  "Find a Midjourney product advertising creator in Delhi with high trust score.",
  "Looking for a Sora & ComfyUI filmmaker for consumer tech ads.",
  "Need an AI animator for gaming promos with commercial rights.",
];

export function CreatorHubAiPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am **CreatorHub AI**. My purpose is to help brands discover and match with verified AI creators.\n\nTell me what you are looking for—such as style, AI tools, domain, format, location, or commercial-use requirements—and I will extract your structured criteria and rank the best creators from our live network.",
      timestamp: new Date(),
    },
  ]);

  // Modal & action state
  const [messageTarget, setMessageTarget] = useState<Creator | null>(null);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle shortlist action
  async function handleShortlist(creatorId: string) {
    if (user?.role !== "BRAND") {
      toast.error("Log in as a Brand to shortlist creators");
      return;
    }
    try {
      if (shortlisted.has(creatorId)) {
        await api(`/api/shortlist/${creatorId}`, { method: "DELETE" });
        setShortlisted((prev) => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
        toast.success("Removed from shortlist");
      } else {
        await api("/api/shortlist", {
          method: "POST",
          body: JSON.stringify({ creatorId }),
        });
        setShortlisted((prev) => new Set(prev).add(creatorId));
        toast.success("Added to shortlist");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update shortlist");
    }
  }

  // Handle message creator action
  function handleMessage(creator: Creator) {
    if (!user) {
      toast.error("Please log in to message creators");
      navigate("/login");
      return;
    }
    if (user.role !== "BRAND") {
      toast.error("Brand account required to message creators and send briefs");
      return;
    }
    setMessageTarget(creator);
  }

  // Send prompt to CreatorHub AI assistant
  async function handleSend(promptText?: string) {
    const text = (promptText || input).trim();
    if (!text || loading) return;

    setInput("");

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await api<AssistantResponse>("/api/ai/assistant", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date(),
        criteria: data.criteria,
        results: data.results,
        totalMatches: data.total,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        sender: "assistant",
        text: "I encountered an issue processing your request. Please try again or refine your query.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error(e instanceof Error ? e.message : "CreatorHub AI request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        id: "welcome-reset",
        sender: "assistant",
        text: "Conversation reset. How can I help you discover creators today?",
        timestamp: new Date(),
      },
    ]);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col px-4 py-6 sm:px-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-ink/8 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              CreatorHub AI
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Matching Engine
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            AI Creator Discovery Assistant
          </h1>
          <p className="mt-1 text-xs text-ink/65 sm:text-sm">
            Describe your project in natural language. CreatorHub AI extracts structured requirements and returns ranked verified creators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Chat
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 text-xs text-ink/75">
            <Link to="/creators">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Manual Search
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Conversation Thread ────────────────────────────────────────────── */}
      <div className="flex-1 space-y-6 pb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-4 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar icon */}
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${
                msg.sender === "user"
                  ? "bg-accent text-white"
                  : "bg-ink text-white shadow-sm ring-2 ring-accent/20"
              }`}
            >
              {msg.sender === "user" ? (
                <UserIcon className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4 text-accent" />
              )}
            </div>

            {/* Message Bubble & Content */}
            <div
              className={`max-w-[92%] sm:max-w-[85%] space-y-3 ${
                msg.sender === "user" ? "items-end text-right" : "items-start text-left"
              }`}
            >
              {/* Message text bubble */}
              <div
                className={`inline-block rounded-3xl p-4 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-accent text-white font-medium"
                    : "border border-ink/8 bg-white text-ink shadow-xs"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              {/* Extracted Structured Requirements Card (from CreatorHub AI) */}
              {msg.criteria && (
                <Card className="border border-accent/20 bg-accent/5 p-4 text-xs">
                  <div className="flex items-center justify-between border-b border-accent/10 pb-2">
                    <span className="flex items-center gap-1.5 font-bold text-accent text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      Extracted Search Requirements
                    </span>
                    <span className="text-[10px] font-medium text-ink/50">
                      Deterministic Taxonomy Parser
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.criteria.skills?.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg border border-accent/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs"
                      >
                        Skill: {sk}
                      </span>
                    ))}

                    {msg.criteria.tools?.map((tl) => (
                      <span
                        key={tl}
                        className="rounded-lg border border-accent/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs"
                      >
                        Tool: {tl}
                      </span>
                    ))}

                    {msg.criteria.specialization && (
                      <span className="rounded-lg border border-accent/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs">
                        Specialization: {msg.criteria.specialization}
                      </span>
                    )}

                    {msg.criteria.contentType && (
                      <span className="rounded-lg border border-accent/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs">
                        Format: {msg.criteria.contentType}
                      </span>
                    )}

                    {msg.criteria.industry && (
                      <span className="rounded-lg border border-accent/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs">
                        Industry: {msg.criteria.industry}
                      </span>
                    )}

                    {msg.criteria.location && (
                      <span className="rounded-lg border border-accent/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs">
                        Location: {msg.criteria.location}
                      </span>
                    )}

                    {msg.criteria.commercialUse === true && (
                      <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-xs">
                        Commercial Rights Cleared
                      </span>
                    )}
                  </div>
                </Card>
              )}

              {/* Ranked Creator Results (The Chatbot Returns Ranked Real Creators!) */}
              {msg.results && msg.results.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink/75">
                    <span>Ranked Matched Creators ({msg.results.length})</span>
                    <Link to="/creators" className="text-accent hover:underline flex items-center gap-1">
                      <span>View in Full Directory</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {msg.results.map((creator) => (
                      <Card
                        key={creator.id}
                        className="flex flex-col justify-between overflow-hidden border border-ink/10 bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="space-y-3">
                          {/* Top: Avatar, Creator info & Match score */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <img
                                src={creator.avatarUrl}
                                alt={creator.user?.name}
                                className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-ink/5"
                              />
                              <div className="min-w-0">
                                <Link
                                  to={`/creators/${creator.id}`}
                                  className="truncate font-bold text-sm text-ink hover:text-accent flex items-center gap-1"
                                >
                                  <span className="truncate">{creator.user?.name}</span>
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                </Link>
                                <p className="truncate text-xs text-ink/65 font-medium">
                                  {creator.specializations?.[0] || creator.headline}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/50">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{creator.location}</span>
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] uppercase font-bold text-ink/40 block">Trust</span>
                              <span className="font-display text-base text-ink">{creator.trustScore}</span>
                            </div>
                          </div>

                          {/* Match Badge */}
                          <div className="pt-0.5">
                            <MatchBadge match={creator.match} />
                          </div>

                          {/* "Why they match" Card with 3-5 actual reasons */}
                          {creator.match?.reasons && creator.match.reasons.length > 0 && (
                            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 text-xs">
                              <div className="mb-2 flex items-center justify-between border-b border-accent/10 pb-1">
                                <span className="font-bold text-[11px] text-ink flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-accent" />
                                  Why they match:
                                </span>
                                <span className="text-[10px] font-bold text-accent">
                                  {creator.match.total}%
                                </span>
                              </div>
                              <ul className="space-y-1.5">
                                {creator.match.reasons.slice(0, 5).map((reason, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 text-[11px] text-ink/85">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                                    <span className="leading-snug">{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Action buttons: View Profile, Shortlist, Message */}
                        <div className="mt-4 pt-3 border-t border-ink/6 grid grid-cols-3 gap-1.5 text-xs">
                          <Button size="sm" variant="outline" className="h-8 px-2 text-[11px] font-medium" asChild>
                            <Link to={`/creators/${creator.id}`}>
                              View Profile
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShortlist(creator.id)}
                            className={`h-8 px-2 text-[11px] font-medium transition ${
                              shortlisted.has(creator.id) ? "border-accent text-accent bg-accent/5" : ""
                            }`}
                          >
                            <Bookmark className={`h-3 w-3 mr-1 ${shortlisted.has(creator.id) ? "fill-accent text-accent" : ""}`} />
                            {shortlisted.has(creator.id) ? "Saved" : "Shortlist"}
                          </Button>

                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => handleMessage(creator)}
                            className="h-8 px-2 text-[11px] font-bold"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 items-center text-xs text-ink/60 animate-pulse">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-ink text-white">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <div className="rounded-3xl border border-ink/10 bg-white px-4 py-3 shadow-xs">
              Analyzing requirements, searching database, and calculating deterministic match scores...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Example prompt pills ────────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-ink/50">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>Try example queries:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-left text-xs text-ink/75 shadow-xs transition hover:border-accent hover:text-accent hover:shadow-sm"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Box & Send Bar ────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-4 z-20 rounded-3xl border border-ink/15 bg-white/95 p-2 shadow-xl backdrop-blur-md transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask CreatorHub AI (e.g. 'I need a cinematic AI video creator for a fashion campaign. They should know Runway and support commercial work.')"
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            variant="accent"
            className="h-10 px-5 rounded-2xl font-semibold gap-1.5 shrink-0"
          >
            <span>Search</span>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {/* Send Brief / Message Modal */}
      {messageTarget && (
        <SendBriefModal
          open={!!messageTarget}
          onClose={() => setMessageTarget(null)}
          creatorId={messageTarget.id}
          creatorName={messageTarget.user?.name || "Creator"}
        />
      )}
    </div>
  );
}
