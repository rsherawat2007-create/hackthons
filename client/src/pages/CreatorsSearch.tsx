import { useEffect, useMemo, useState, useCallback, FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
  Layers,
  Wrench,
  Film,
  Tag,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  SearchX,
  ArrowUpDown,
  Filter,
  Loader2,
  Map,
  Grid3X3,
} from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { SendBriefModal } from "@/components/SendBriefModal";
import { CreatorDiscoveryMap } from "@/components/map/CreatorDiscoveryMap";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  CONTENT_TYPES,
  SPECIALIZATIONS,
  TOOLS,
  SKILLS,
  INDUSTRIES,
  AVAILABILITIES,
  LOCATIONS,
  type Creator,
} from "@/types";

interface RelaxationSuggestion {
  id: string;
  label: string;
  type: "tool" | "location" | "skill" | "specialization" | "contentType" | "commercialUse" | "experience" | "keyword";
  value?: string;
}

interface EmptyStateData {
  noExactMatches: boolean;
  title: string;
  message: string;
  suggestions: RelaxationSuggestion[];
}

interface SearchResponse {
  results: Creator[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  nlCriteria?: StructuredSearchCriteria | null;
  emptyState?: EmptyStateData | null;
  relatedCreators?: Creator[];
}

interface StructuredSearchCriteria {
  rawQuery: string;
  keyword?: string;
  skills: string[];
  tools: string[];
  specialization?: string;
  contentType?: string;
  industry?: string;
  location?: string;
  commercialUse?: boolean | null;
  experienceYearsMin?: number | null;
  availability?: string;
  interpretedIntent: string;
  source: "ai" | "deterministic";
}

interface FilterOptions {
  locations: string[];
  availabilities: string[];
  industries: string[];
  skills: string[];
  tools: string[];
  specializations: string[];
  contentTypes: string[];
}

export function CreatorsSearch() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  // Natural Language Search State
  const [isNlMode, setIsNlMode] = useState(true);
  const [nlInput, setNlInput] = useState(params.get("keyword") || params.get("q") || "");
  const [parsingNl, setParsingNl] = useState(false);
  const [nlCriteria, setNlCriteria] = useState<StructuredSearchCriteria | null>(null);

  // Map View Layout State
  const [showMap, setShowMap] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);

  // Search & Filter State
  const [keyword, setKeyword] = useState(params.get("keyword") || params.get("q") || "");
  const [skill, setSkill] = useState(params.get("skill") || "");
  const [tool, setTool] = useState(params.get("tool") || "");
  const [specialization, setSpecialization] = useState(params.get("specialization") || "");
  const [contentType, setContentType] = useState(params.get("contentType") || "");
  const [industry, setIndustry] = useState(params.get("industry") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [commercialUse, setCommercialUse] = useState(params.get("commercialUse") || "");
  const [availability, setAvailability] = useState(params.get("availability") || "");
  const [experience, setExperience] = useState(params.get("experience") || "");
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "match");
  const [page, setPage] = useState(parseInt(params.get("page") || "1", 10) || 1);
  const [limit] = useState(8);

  // Results & Request State
  const [results, setResults] = useState<Creator[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [relatedCreators, setRelatedCreators] = useState<Creator[]>([]);
  const [emptyStateData, setEmptyStateData] = useState<EmptyStateData | null>(null);

  // Shortlist and Send Brief state
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [sendTo, setSendTo] = useState<Creator | null>(null);

  // Dynamic filter options from DB
  const [dbFilters, setDbFilters] = useState<FilterOptions | null>(null);

  // Load distinct filter options from database on mount
  useEffect(() => {
    api<FilterOptions>("/api/creators/filters")
      .then((data) => setDbFilters(data))
      .catch(() => {});
  }, []);

  // Merge database options with standard system taxonomy
  const mergedLocations = useMemo(() => {
    const set = new Set([...(dbFilters?.locations || []), ...LOCATIONS]);
    return Array.from(set).sort();
  }, [dbFilters]);

  const mergedIndustries = useMemo(() => {
    const set = new Set([...(dbFilters?.industries || []), ...INDUSTRIES]);
    return Array.from(set).sort();
  }, [dbFilters]);

  const mergedAvailabilities = useMemo(() => {
    const set = new Set([...(dbFilters?.availabilities || []), ...AVAILABILITIES]);
    return Array.from(set).sort();
  }, [dbFilters]);

  const mergedTools = useMemo(() => {
    const set = new Set([...(dbFilters?.tools || []), ...TOOLS]);
    return Array.from(set).sort();
  }, [dbFilters]);

  const mergedSkills = useMemo(() => {
    const set = new Set([...(dbFilters?.skills || []), ...SKILLS]);
    return Array.from(set).sort();
  }, [dbFilters]);

  const mergedSpecializations = useMemo(() => {
    const set = new Set([...(dbFilters?.specializations || []), ...SPECIALIZATIONS]);
    return Array.from(set).sort();
  }, [dbFilters]);

  const mergedContentTypes = useMemo(() => {
    const set = new Set([...(dbFilters?.contentTypes || []), ...CONTENT_TYPES]);
    return Array.from(set).sort();
  }, [dbFilters]);

  // Count active filters (excluding default sortBy and page)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (keyword.trim()) count++;
    if (skill) count++;
    if (tool) count++;
    if (specialization) count++;
    if (contentType) count++;
    if (industry) count++;
    if (location) count++;
    if (commercialUse) count++;
    if (availability) count++;
    if (experience) count++;
    return count;
  }, [keyword, skill, tool, specialization, contentType, industry, location, commercialUse, availability, experience]);

  // Build query string
  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    if (keyword.trim()) q.set("keyword", keyword.trim());
    if (skill) q.set("skill", skill);
    if (tool) q.set("tool", tool);
    if (specialization) q.set("specialization", specialization);
    if (contentType) q.set("contentType", contentType);
    if (industry) q.set("industry", industry);
    if (location) q.set("location", location);
    if (commercialUse) q.set("commercialUse", commercialUse);
    if (availability) q.set("availability", availability);
    if (experience) q.set("experience", experience);
    if (sortBy && sortBy !== "match") q.set("sortBy", sortBy);
    if (page > 1) q.set("page", String(page));
    q.set("limit", String(limit));
    return q.toString();
  }, [keyword, skill, tool, specialization, contentType, industry, location, commercialUse, availability, experience, sortBy, page, limit]);

  // Execute database search
  const executeSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<SearchResponse>(`/api/creators/search?${queryString}`);
      setResults(data.results || []);
      setTotalCount(data.total ?? data.results.length);
      setTotalPages(data.totalPages ?? Math.max(1, Math.ceil((data.total ?? data.results.length) / limit)));
      setRelatedCreators(data.relatedCreators || []);
      setEmptyStateData(data.emptyState || null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database search failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [queryString, limit]);

  // Debounced search on query changes
  useEffect(() => {
    const t = setTimeout(() => {
      setParams(new URLSearchParams(queryString), { replace: true });
      executeSearch();
    }, 250);
    return () => clearTimeout(t);
  }, [queryString, executeSearch, setParams]);

  // Run natural-language search parser
  async function runNlSearch(promptText: string) {
    const prompt = promptText.trim();
    if (!prompt) return;

    setNlInput(prompt);

    if (!isNlMode) {
      setKeyword(prompt);
      setPage(1);
      return;
    }

    setParsingNl(true);
    try {
      const res = await api<{ criteria: StructuredSearchCriteria }>("/api/creators/parse-search", {
        method: "POST",
        body: JSON.stringify({ query: prompt }),
      });
      const crit = res.criteria;
      setNlCriteria(crit);

      if (crit.tools?.length) setTool(crit.tools[0]);
      if (crit.specialization) setSpecialization(crit.specialization);
      if (crit.contentType) setContentType(crit.contentType);
      if (crit.industry) setIndustry(crit.industry);
      if (crit.location) setLocation(crit.location);
      if (crit.skills?.length) setSkill(crit.skills[0]);
      if (crit.commercialUse === true) setCommercialUse("true");
      else if (crit.commercialUse === false) setCommercialUse("false");

      setKeyword(crit.keyword || "");
      setPage(1);
      toast.success(crit.interpretedIntent);
    } catch {
      setKeyword(prompt);
      setPage(1);
    } finally {
      setParsingNl(false);
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nlInput.trim()) return;
    runNlSearch(nlInput);
  }

  // Suggestions to relax filters when 0 exact results match
  const relaxationSuggestions = useMemo<RelaxationSuggestion[]>(() => {
    if (emptyStateData?.suggestions?.length) {
      return emptyStateData.suggestions;
    }
    const list: RelaxationSuggestion[] = [];
    if (tool) {
      list.push({
        id: `remove-tool-${tool}`,
        label: `Remove ${tool} filter`,
        type: "tool",
        value: tool,
      });
    }
    if (location) {
      list.push({
        id: "expand-location",
        label: "Expand location",
        type: "location",
        value: location,
      });
    }
    if (skill) {
      list.push({
        id: "include-related-skills",
        label: "Include related skills",
        type: "skill",
        value: skill,
      });
    }
    if (specialization) {
      list.push({
        id: "remove-specialization-restriction",
        label: "Remove specialization restriction",
        type: "specialization",
        value: specialization,
      });
    }
    if (contentType) {
      list.push({
        id: "include-similar-content-types",
        label: "Include similar content types",
        type: "contentType",
        value: contentType,
      });
    }
    if (commercialUse) {
      list.push({
        id: "allow-all-commercial",
        label: "Include all commercial options",
        type: "commercialUse",
      });
    }
    if (experience) {
      list.push({
        id: "lower-experience",
        label: "Lower minimum experience requirement",
        type: "experience",
      });
    }
    if (keyword.trim()) {
      list.push({
        id: "remove-keyword",
        label: `Remove "${keyword.trim()}" keyword restriction`,
        type: "keyword",
        value: keyword.trim(),
      });
    }
    return list;
  }, [emptyStateData, tool, location, skill, specialization, contentType, commercialUse, experience, keyword]);

  // Apply one-click filter relaxation
  function applyRelaxation(type: RelaxationSuggestion["type"], value?: string) {
    switch (type) {
      case "tool":
        setTool("");
        toast.info(`Removed ${value || "tool"} filter`);
        break;
      case "location":
        setLocation("");
        toast.info("Expanded location to all regions");
        break;
      case "skill":
        setSkill("");
        toast.info("Included related skills");
        break;
      case "specialization":
        setSpecialization("");
        toast.info("Removed specialization restriction");
        break;
      case "contentType":
        setContentType("");
        toast.info("Included similar content types");
        break;
      case "commercialUse":
        setCommercialUse("");
        toast.info("Allowed all commercial license terms");
        break;
      case "experience":
        setExperience("");
        toast.info("Relaxed experience filter");
        break;
      case "keyword":
        setKeyword("");
        toast.info("Cleared keyword filter");
        break;
    }
    setPage(1);
  }

  // Clear all filters back to fresh discovery state
  function clearAllFilters() {
    setNlInput("");
    setNlCriteria(null);
    setKeyword("");
    setSkill("");
    setTool("");
    setSpecialization("");
    setContentType("");
    setIndustry("");
    setLocation("");
    setCommercialUse("");
    setAvailability("");
    setExperience("");
    setSortBy("match");
    setPage(1);
    setSelectedCreatorId(null);
    setRelatedCreators([]);
    setEmptyStateData(null);
    toast.info("All filters cleared");
  }

  // Handle pagination
  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Shortlist action
  async function shortlist(id: string) {
    if (user?.role !== "BRAND") return toast.error("Log in as a Brand to shortlist creators");
    try {
      await api("/api/shortlist", { method: "POST", body: JSON.stringify({ creatorId: id }) });
      setShortlisted((s) => new Set(s).add(id));
      toast.success("Added to shortlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not shortlist creator");
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Top Header & Hero ─────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-ink/8 pb-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Creator Discovery
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              Live Database
            </span>
          </div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl lg:text-5xl">
            Find Verified AI Creators
          </h1>
          <p className="mt-1 text-sm text-ink/60 sm:text-base">
            Search top generative filmmakers, motion designers, and AI artists with interactive map discovery.
          </p>
        </div>

        {/* View Controls & CreatorHub AI Assistant Shortcut */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="accent" size="sm" asChild className="h-8 gap-1.5 font-semibold text-xs shadow-xs">
            <Link to="/assistant">
              <Sparkles className="h-3.5 w-3.5" />
              CreatorHub AI Assistant
            </Link>
          </Button>

          {/* Desktop Split / Full Width Map Switcher */}
          <div className="hidden lg:flex items-center rounded-xl bg-ink/5 p-1 text-xs">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                showMap ? "bg-white text-ink shadow-xs" : "text-ink/60 hover:text-ink"
              }`}
            >
              <Map className="h-3.5 w-3.5 text-accent" />
              Split with Map
            </button>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                !showMap ? "bg-white text-ink shadow-xs" : "text-ink/60 hover:text-ink"
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Grid Only
            </button>
          </div>

          {/* Mobile List / Map Toggle */}
          <div className="flex lg:hidden rounded-xl bg-ink/5 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                mobileView === "list" ? "bg-white text-ink shadow-xs" : "text-ink/60 hover:text-ink"
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setMobileView("map")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                mobileView === "map" ? "bg-white text-ink shadow-xs" : "text-ink/60 hover:text-ink"
              }`}
            >
              <Map className="h-3.5 w-3.5 text-accent" />
              Map ({results.length})
            </button>
          </div>

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-1.5 lg:hidden text-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-rose-600">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Natural-Language Smart Search Hero Box ────────────────────────── */}
      <Card className="mb-8 border border-ink/10 bg-gradient-to-br from-mist/90 via-white to-violet-50/40 p-6 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white shadow-sm">
              <Sparkles className="h-4 w-4 text-accent" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Natural-Language Creator Search</h2>
              <p className="text-xs text-ink/60">
                Describe the creator you need in plain English — our smart parser maps it to structured database criteria.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink/50">Search Mode:</span>
            <div className="flex rounded-xl bg-ink/5 p-1 text-xs">
              <button
                type="button"
                onClick={() => setIsNlMode(true)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition ${
                  isNlMode ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
                }`}
              >
                <Sparkles className="h-3 w-3 text-accent" />
                AI Smart Search
              </button>
              <button
                type="button"
                onClick={() => setIsNlMode(false)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition ${
                  !isNlMode ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
                }`}
              >
                <Search className="h-3 w-3" />
                Keyword Only
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-ink/40" />
            <Input
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder={
                isNlMode
                  ? 'e.g. "Runway expert in Delhi", "AI video creator for fashion", "I need a creator for a cinematic product advertisement"'
                  : "e.g. Maya Chen, Runway, DaVinci Resolve, London..."
              }
              className="h-11 bg-white pl-10 pr-10 text-sm shadow-xs"
            />
            {nlInput && (
              <button
                type="button"
                onClick={() => {
                  setNlInput("");
                  if (nlCriteria) setNlCriteria(null);
                }}
                className="absolute right-3.5 top-3.5 text-ink/40 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="accent"
            className="h-11 shrink-0 px-6 font-semibold"
            disabled={parsingNl || !nlInput.trim()}
          >
            {parsingNl ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing Intent…
              </>
            ) : isNlMode ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Smart Search
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>

        {/* Example prompt pills */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-medium text-ink/40">Try examples:</span>
          {[
            "AI video creator",
            "AI video creator for fashion",
            "Runway expert in Delhi",
            "I need a creator for a cinematic product advertisement",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => runNlSearch(prompt)}
              className="rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-[11px] text-ink/70 transition hover:border-accent hover:bg-white hover:text-accent shadow-xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Interpreted Intent Banner */}
        {nlCriteria && (
          <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/5 p-4 text-xs text-ink">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white">
                  <Sparkles className="h-3 w-3" />
                  {nlCriteria.source === "ai" ? "AI Extracted" : "Smart Parser"}
                </span>
                <span className="font-semibold text-ink text-sm">{nlCriteria.interpretedIntent}</span>
              </div>
              <button
                type="button"
                onClick={() => setNlCriteria(null)}
                className="self-start text-[11px] text-ink/50 underline hover:text-ink sm:self-auto"
              >
                Dismiss explanation
              </button>
            </div>

            {/* Extracted Criteria Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-ink/40">Extracted filters:</span>
              {nlCriteria.tools?.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-accent/30 bg-white px-2 py-0.5 text-[11px] font-medium text-accent shadow-xs"
                >
                  Tool: {t}
                </span>
              ))}
              {nlCriteria.specialization && (
                <span className="rounded-md border border-accent/30 bg-white px-2 py-0.5 text-[11px] font-medium text-accent shadow-xs">
                  Specialization: {nlCriteria.specialization}
                </span>
              )}
              {nlCriteria.contentType && nlCriteria.contentType !== nlCriteria.specialization && (
                <span className="rounded-md border border-accent/30 bg-white px-2 py-0.5 text-[11px] font-medium text-accent shadow-xs">
                  Format: {nlCriteria.contentType}
                </span>
              )}
              {nlCriteria.industry && (
                <span className="rounded-md border border-accent/30 bg-white px-2 py-0.5 text-[11px] font-medium text-accent shadow-xs">
                  Industry: {nlCriteria.industry}
                </span>
              )}
              {nlCriteria.location && (
                <span className="rounded-md border border-accent/30 bg-white px-2 py-0.5 text-[11px] font-medium text-accent shadow-xs">
                  Location: {nlCriteria.location}
                </span>
              )}
              {nlCriteria.skills?.slice(0, 2).map((sk) => (
                <span
                  key={sk}
                  className="rounded-md border border-accent/30 bg-white px-2 py-0.5 text-[11px] font-medium text-accent shadow-xs"
                >
                  Skill: {sk}
                </span>
              ))}
              {nlCriteria.commercialUse === true && (
                <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 shadow-xs">
                  Commercial Rights Cleared
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Main Workspace: Split View with Left (Search+Filters+Results) and Right (Interactive Map) ── */}
      <div
        className={`grid gap-8 ${
          showMap
            ? "lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px]"
            : "grid-cols-1"
        }`}
      >
        {/* ── LEFT COLUMN: Search + Filters + Results ───────────────────── */}
        <div
          className={`min-w-0 ${
            mobileView === "map" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="grid gap-6 md:grid-cols-[250px_1fr]">
            {/* Filter Sidebar */}
            <aside
              className={`${
                mobileFiltersOpen ? "block" : "hidden"
              } md:block h-fit rounded-3xl border border-ink/8 bg-white p-5 shadow-sm sticky top-20`}
            >
              <div className="flex items-center justify-between border-b border-ink/8 pb-3.5">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-accent" />
                  <h2 className="font-semibold text-ink text-sm">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3.5 text-xs font-medium text-ink/70">
                {/* 1. Keyword */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Search className="h-3 w-3 text-ink/50" />
                    Keyword
                  </label>
                  <div className="relative">
                    <Input
                      className="h-9 text-xs"
                      placeholder="e.g. Maya, Sneaker"
                      value={keyword}
                      onChange={(e) => {
                        setKeyword(e.target.value);
                        setPage(1);
                      }}
                    />
                    {keyword && (
                      <button
                        type="button"
                        onClick={() => {
                          setKeyword("");
                          setPage(1);
                        }}
                        className="absolute right-2 top-2 text-ink/40 hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Skill */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Tag className="h-3 w-3 text-ink/50" />
                    Skill
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={skill}
                    onChange={(e) => {
                      setSkill(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Skills</option>
                    {mergedSkills.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. AI Tool / Model */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Wrench className="h-3 w-3 text-ink/50" />
                    AI Tool & Model
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={tool}
                    onChange={(e) => {
                      setTool(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Tools</option>
                    {mergedTools.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Specialization */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Layers className="h-3 w-3 text-ink/50" />
                    Specialization
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={specialization}
                    onChange={(e) => {
                      setSpecialization(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Specializations</option>
                    {mergedSpecializations.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Content Type */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Film className="h-3 w-3 text-ink/50" />
                    Content Type
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={contentType}
                    onChange={(e) => {
                      setContentType(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Types</option>
                    {mergedContentTypes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Industry */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Briefcase className="h-3 w-3 text-ink/50" />
                    Industry
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={industry}
                    onChange={(e) => {
                      setIndustry(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Industries</option>
                    {mergedIndustries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Location */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <MapPin className="h-3 w-3 text-ink/50" />
                    Location
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Locations</option>
                    {mergedLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Availability */}
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                    <Clock className="h-3 w-3 text-ink/50" />
                    Availability
                  </label>
                  <select
                    className="h-9 w-full rounded-xl border border-ink/10 bg-white px-2.5 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={availability}
                    onChange={(e) => {
                      setAvailability(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Any Availability</option>
                    {mergedAvailabilities.map((av) => (
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9. Commercial-Use Rights */}
                <div>
                  <label className="mb-1 block font-semibold text-ink text-[11px]">Commercial Rights</label>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-mist p-1">
                    {[
                      ["", "Any"],
                      ["true", "Cleared"],
                      ["false", "Standard"],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setCommercialUse(val);
                          setPage(1);
                        }}
                        className={`rounded-lg py-1 text-center text-[10px] font-semibold transition ${
                          commercialUse === val
                            ? "bg-white text-ink shadow-xs"
                            : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 10. Minimum Experience */}
                <div>
                  <label className="mb-1 block font-semibold text-ink text-[11px]">Min. Experience (Yrs)</label>
                  <Input
                    type="number"
                    min="0"
                    max="25"
                    placeholder="e.g. 2"
                    className="h-9 text-xs"
                    value={experience}
                    onChange={(e) => {
                      setExperience(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-ink/8 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={clearAllFilters}
                  disabled={activeFiltersCount === 0}
                >
                  <RotateCcw className="mr-1.5 h-3 w-3" />
                  Reset Filters
                </Button>
              </div>
            </aside>

            {/* Results Grid Container */}
            <div className="min-w-0">
              {/* Controls Bar: Results Count & Sorting */}
              <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-ink/8 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-semibold text-ink">
                    {loading ? (
                      "Searching…"
                    ) : (
                      <>
                        <span className="font-bold text-accent">{totalCount}</span> {totalCount === 1 ? "Creator" : "Creators"} Found
                      </>
                    )}
                  </p>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] text-ink/40">({activeFiltersCount} active)</span>
                  )}
                </div>

                {/* Sorting */}
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="h-3 w-3 text-ink/50" />
                  <span className="font-medium text-ink/60 text-[11px]">Sort:</span>
                  <select
                    className="h-8 rounded-lg border border-ink/10 bg-white px-2 text-xs text-ink transition focus:border-accent focus:outline-none"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="match">Match Score</option>
                    <option value="trust">Trust Score</option>
                    <option value="experience">Experience</option>
                    <option value="name">Name (A–Z)</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFiltersCount > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-ink/40">Active:</span>
                  {keyword && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink shadow-2xs">
                      Keyword: "{keyword}"
                      <button type="button" onClick={() => setKeyword("")} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {skill && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink shadow-2xs">
                      Skill: {skill}
                      <button type="button" onClick={() => setSkill("")} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {tool && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink shadow-2xs">
                      Tool: {tool}
                      <button type="button" onClick={() => setTool("")} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {specialization && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink shadow-2xs">
                      Specialization: {specialization}
                      <button type="button" onClick={() => setSpecialization("")} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink shadow-2xs">
                      Location: {location}
                      <button type="button" onClick={() => setLocation("")} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] font-semibold text-rose-600 underline hover:text-rose-700 ml-1"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* State 1: ERROR STATE */}
              {error && (
                <Card className="mb-6 border-rose-200 bg-rose-50/70 p-6 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-rose-600" />
                  <h3 className="mt-2 font-semibold text-rose-950">Search Encountered an Error</h3>
                  <p className="mt-1 text-xs text-rose-700">{error}</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button size="sm" variant="accent" onClick={executeSearch}>
                      Retry Search
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearAllFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </Card>
              )}

              {/* State 2: LOADING SKELETON */}
              {loading ? (
                <div
                  className={`grid gap-4 ${
                    showMap ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"
                  }`}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse overflow-hidden p-0">
                      <div className="h-36 bg-ink/10" />
                      <div className="space-y-3 p-4">
                        <div className="flex items-start gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-ink/10" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-3/4 rounded bg-ink/10" />
                            <div className="h-3 w-1/2 rounded bg-ink/10" />
                          </div>
                        </div>
                        <div className="h-7 w-full rounded bg-ink/10" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : results.length === 0 ? (
                /* State 3: IMPROVED EMPTY SEARCH EXPERIENCE */
                <div className="space-y-6">
                  {/* Empty State Banner with Relaxation Suggestions */}
                  <Card className="border border-amber-200 bg-linear-to-b from-amber-50/50 via-white to-white p-6 sm:p-7 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 shadow-2xs mx-auto sm:mx-0">
                        <SearchX className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="font-display text-xl font-bold text-ink">
                            No exact matches found.
                          </h3>
                          <span className="rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                            0 exact results
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-ink/70 max-w-xl">
                          No creators match all your selected filters at the same time. Try relaxing one or more filters below to broaden your search:
                        </p>

                        {/* Filter Relaxation Suggestions */}
                        {relaxationSuggestions.length > 0 && (
                          <div className="mt-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">
                              Suggested filter relaxations
                            </p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                              {relaxationSuggestions.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => applyRelaxation(s.type, s.value)}
                                  className="group inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition hover:border-accent hover:bg-accent/5 hover:text-accent"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500 group-hover:text-accent transition-colors" />
                                  <span>{s.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3 border-t border-ink/8 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className="h-8 text-xs font-semibold"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Clear All Filters & Show Community
                          </Button>
                          {activeFiltersCount > 0 && (
                            <span className="text-[11px] text-ink/50">
                              {activeFiltersCount} active {activeFiltersCount === 1 ? "filter" : "filters"} applied
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Related Creators Section (From Real Database, Not Fabricated) */}
                  {relatedCreators.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/8 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display text-lg font-bold text-ink">
                              Related Creators
                            </h4>
                            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                              {relatedCreators.length} Found with Partial Overlap
                            </span>
                          </div>
                          <p className="text-xs text-ink/60 mt-0.5">
                            These verified creators match several of your requirements (such as tools, skills, or portfolio categories) from our database:
                          </p>
                        </div>
                      </div>

                      <div
                        className={`grid gap-4 ${
                          showMap ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"
                        }`}
                      >
                        {relatedCreators.map((c) => (
                          <div
                            key={c.id}
                            onMouseEnter={() => setSelectedCreatorId(c.id)}
                            className={`transition-all rounded-2xl ${
                              selectedCreatorId === c.id ? "ring-2 ring-accent" : ""
                            }`}
                          >
                            <CreatorCard
                              creator={c}
                              shortlisted={shortlisted.has(c.id)}
                              onShortlist={user?.role === "BRAND" ? () => shortlist(c.id) : undefined}
                              onSend={user?.role === "BRAND" ? () => setSendTo(c) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* State 4: CREATOR RESULTS CARDS */
                <>
                  <div
                    className={`grid gap-4 ${
                      showMap ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"
                    }`}
                  >
                    {results.map((c) => (
                      <div
                        key={c.id}
                        onMouseEnter={() => setSelectedCreatorId(c.id)}
                        className={`transition-all rounded-2xl ${
                          selectedCreatorId === c.id ? "ring-2 ring-accent" : ""
                        }`}
                      >
                        <CreatorCard
                          creator={c}
                          shortlisted={shortlisted.has(c.id)}
                          onShortlist={user?.role === "BRAND" ? () => shortlist(c.id) : undefined}
                          onSend={user?.role === "BRAND" ? () => setSendTo(c) : undefined}
                        />
                      </div>
                    ))}
                  </div>

                  {/* State 5: PAGINATION */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-ink/8 pt-5 sm:flex-row">
                      <p className="text-xs text-ink/60">
                        Page <span className="font-semibold text-ink">{page}</span> of{" "}
                        <span className="font-semibold text-ink">{totalPages}</span>
                      </p>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(page - 1)}
                          disabled={page <= 1}
                          className="h-8 px-2 text-xs"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => goToPage(p)}
                            className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                              page === p
                                ? "bg-ink text-white"
                                : "border border-ink/10 bg-white text-ink hover:bg-mist"
                            }`}
                          >
                            {p}
                          </button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(page + 1)}
                          disabled={page >= totalPages}
                          className="h-8 px-2 text-xs"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Interactive Map (Desktop Sticky or Mobile View) ── */}
        <div
          className={`${
            showMap ? "block" : "hidden"
          } ${mobileView === "map" ? "block lg:block" : "hidden lg:block"}`}
        >
          <div className="sticky top-20 h-[calc(100vh-100px)] max-h-[820px] min-h-[520px]">
            <CreatorDiscoveryMap
              creators={results.length > 0 ? results : relatedCreators}
              selectedCreatorId={selectedCreatorId}
              onSelectCreator={setSelectedCreatorId}
            />
          </div>
        </div>
      </div>

      {/* Send Brief Modal */}
      <SendBriefModal
        open={!!sendTo}
        onClose={() => setSendTo(null)}
        creatorId={sendTo?.id || ""}
        creatorName={sendTo?.user.name || ""}
      />
    </div>
  );
}
