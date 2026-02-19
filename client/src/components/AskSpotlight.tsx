import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Sparkles,
  Send,
  Loader2,
  Calendar,
  Users,
  Building2,
  X,
  Command,
  ArrowRight,
  Search,
} from "lucide-react";

// ─── Spotlight Context ────────────────────────────────────────────────────
// This component manages its own state. Parent just renders <AskSpotlight />.

interface AskSpotlightProps {
  onClose: () => void;
}

export default function AskSpotlight({ onClose }: AskSpotlightProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const askMutation = trpc.ask.ask.useMutation({
    onSuccess: (data) => setResults(data),
  });

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleAsk = () => {
    if (!query.trim()) return;
    askMutation.mutate({ query });
  };

  const handleSuggestion = (q: string) => {
    setQuery(q);
    askMutation.mutate({ query: q });
  };

  const handleMeetingClick = (meetingId: number) => {
    onClose();
    setLocation(`/meeting/${meetingId}`);
  };

  const handleReset = () => {
    setQuery("");
    setResults(null);
    askMutation.reset();
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Spotlight Modal */}
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
            <Sparkles className="h-5 w-5 text-yellow-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAsk();
              }}
              placeholder="Ask OmniScope anything..."
              className="flex-1 bg-transparent text-white text-base placeholder:text-zinc-500 outline-none"
              disabled={askMutation.isPending}
            />
            {askMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin text-yellow-500 shrink-0" />
            ) : query.trim() ? (
              <button
                onClick={handleAsk}
                className="p-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-black transition-colors shrink-0"
                title="Search"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content area — scrollable */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* No results yet — show suggestions */}
            {!results && !askMutation.isPending && (
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold px-1">
                  Try asking
                </p>
                {[
                  "Show me all meetings with Paul",
                  "What opportunities did we identify in UAE?",
                  "Find meetings about OTC Liquidity",
                  "What risks were mentioned in banking discussions?",
                  "Show me meetings from this week",
                  "Find all discussions with family offices",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestion(suggestion)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <Search className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {askMutation.isPending && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                  <span className="text-sm">Searching your intelligence vault...</span>
                </div>
              </div>
            )}

            {/* Results */}
            {results && !askMutation.isPending && (
              <div className="p-4 space-y-4">
                {/* Answer */}
                <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Answer</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{results.answer}</p>
                </div>

                {/* Relevant Meetings */}
                {results.meetings?.length > 0 && (
                  <div>
                    <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold px-1 mb-2">
                      Relevant Meetings ({results.meetings.length})
                    </p>
                    <div className="space-y-1.5">
                      {results.meetings.slice(0, 5).map((meeting: any) => (
                        <button
                          key={meeting.id}
                          onClick={() => handleMeetingClick(meeting.id)}
                          className="w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                        >
                          <Calendar className="h-4 w-4 text-emerald-500/60 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-200 group-hover:text-white transition-colors truncate">
                              {meeting.participants?.join(", ") || "Meeting"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-zinc-500">
                                {new Date(meeting.meetingDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {meeting.organizations?.[0] && (
                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                  <Building2 className="h-2.5 w-2.5" />
                                  {meeting.organizations[0]}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-1 mt-1">
                              {meeting.executiveSummary}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors mt-1 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up questions */}
                {results.suggestedQuestions?.length > 0 && (
                  <div>
                    <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold px-1 mb-2">
                      Follow up
                    </p>
                    <div className="space-y-1">
                      {results.suggestedQuestions.map((q: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestion(q)}
                          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                        >
                          <Search className="h-3 w-3 text-zinc-600 shrink-0" />
                          <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                            {q}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New search button */}
                <button
                  onClick={handleReset}
                  className="w-full text-center text-xs text-zinc-500 hover:text-yellow-500 transition-colors py-2"
                >
                  Ask another question
                </button>
              </div>
            )}

            {/* Error */}
            {askMutation.isError && (
              <div className="p-4">
                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-400">Failed to process your question. Please try again.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with keyboard hint */}
          <div className="px-5 py-2.5 border-t border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[10px]">Enter</kbd>
                to search
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[10px]">Esc</kbd>
                to close
              </span>
            </div>
            <a
              href="/ask"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                setLocation("/ask");
              }}
              className="text-[10px] text-zinc-500 hover:text-yellow-500 transition-colors flex items-center gap-1"
            >
              Open full page <ArrowRight className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Floating trigger button ──────────────────────────────────────────────
// Renders a small floating button in the bottom-right corner
export function AskSpotlightTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/60 shadow-lg shadow-black/30 hover:border-yellow-600/40 hover:bg-zinc-800 transition-all group"
      title="Ask OmniScope (⌘K)"
    >
      <Sparkles className="h-4 w-4 text-yellow-500" />
      <span className="text-sm text-zinc-400 group-hover:text-white transition-colors hidden sm:inline">
        Ask OmniScope
      </span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-500 font-mono">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}
