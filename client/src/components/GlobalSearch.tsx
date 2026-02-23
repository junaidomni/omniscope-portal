import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MessageCircle, Users, Calendar, CheckSquare, Phone, FileText, X } from "lucide-react";
import { useLocation } from "wouter";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const { data: results, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const handleResultClick = (type: string, id: number, channelId?: number) => {
    onOpenChange(false);
    
    switch (type) {
      case "message":
        if (channelId) {
          setLocation(`/chat?channel=${channelId}`);
        }
        break;
      case "contact":
        setLocation(`/contacts?id=${id}`);
        break;
      case "meeting":
        setLocation(`/meetings?id=${id}`);
        break;
      case "task":
        setLocation(`/operations?task=${id}`);
        break;
      case "call":
        setLocation(`/calls?id=${id}`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case "contact": return <Users className="h-4 w-4 text-emerald-400" />;
      case "meeting": return <Calendar className="h-4 w-4 text-purple-400" />;
      case "task": return <CheckSquare className="h-4 w-4 text-orange-400" />;
      case "call": return <Phone className="h-4 w-4 text-cyan-400" />;
      default: return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "message": return "Message";
      case "contact": return "Contact";
      case "meeting": return "Meeting";
      case "task": return "Task";
      case "call": return "Call";
      default: return "Result";
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-300 font-medium">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="h-5 w-5 text-zinc-500" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, contacts, meetings, tasks, calls..."
            className="flex-1 border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono text-zinc-500 bg-zinc-800 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[500px]">
          {!query || query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Search className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Type at least 2 characters to search</p>
              <p className="text-xs text-zinc-600 mt-1">
                Search across messages, contacts, meetings, tasks, and call transcripts
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
            </div>
          ) : !results || results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Search className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-400">No results found for "{query}"</p>
              <p className="text-xs text-zinc-600 mt-1">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result: any, index: number) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result.type, result.id, result.channelId)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div className="shrink-0 mt-0.5">{getIcon(result.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700">
                        {getTypeLabel(result.type)}
                      </Badge>
                      {result.subtitle && (
                        <span className="text-xs text-zinc-500 truncate">{result.subtitle}</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-white font-medium mb-1 line-clamp-1">
                      {highlightMatch(result.title, query)}
                    </p>
                    
                    {result.content && (
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {highlightMatch(result.content, query)}
                      </p>
                    )}
                    
                    {result.metadata && (
                      <div className="flex items-center gap-2 mt-1">
                        {result.metadata.split(" · ").map((meta: string, i: number) => (
                          <span key={i} className="text-[10px] text-zinc-600">{meta}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {result.relevance && (
                    <div className="shrink-0 text-[10px] text-zinc-600">
                      {Math.round(result.relevance * 100)}%
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-4 text-[10px] text-zinc-600">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">↵</kbd>
              <span>Select</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-600">
            {results && results.length > 0 && `${results.length} result${results.length > 1 ? "s" : ""}`}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to trigger global search with keyboard shortcut
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
