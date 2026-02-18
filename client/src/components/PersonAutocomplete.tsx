import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { User, Building2, Plus, X, Search, Loader2 } from "lucide-react";

export interface PersonResult {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  companyId: number | null;
  photoUrl: string | null;
  title: string | null;
  category: string | null;
}

interface PersonAutocompleteProps {
  value: PersonResult | null;
  onChange: (person: PersonResult | null) => void;
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
  onCreateNew?: (query: string) => void;
  disabled?: boolean;
  /** If true, shows just the email string input with autocomplete overlay */
  emailMode?: boolean;
  /** For email mode: the raw email string */
  emailValue?: string;
  onEmailChange?: (email: string) => void;
}

export function PersonAutocomplete({
  value,
  onChange,
  placeholder = "Search contacts...",
  className = "",
  allowCreate = true,
  onCreateNew,
  disabled = false,
  emailMode = false,
  emailValue = "",
  onEmailChange,
}: PersonAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchQuery = emailMode ? emailValue : query;
  const shouldSearch = searchQuery.length >= 2;

  const { data: results, isLoading } = trpc.directory.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: shouldSearch && isOpen }
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (person: PersonResult) => {
      onChange(person);
      if (emailMode && onEmailChange) {
        onEmailChange(person.email || "");
      }
      setQuery(person.name);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange, emailMode, onEmailChange]
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery("");
    if (emailMode && onEmailChange) {
      onEmailChange("");
    }
    inputRef.current?.focus();
  }, [onChange, emailMode, onEmailChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results) return;

    const totalItems = results.length + (allowCreate && query.length > 0 ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      if (focusedIndex < results.length) {
        handleSelect(results[focusedIndex]);
      } else if (allowCreate && onCreateNew) {
        onCreateNew(query);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleInputChange = (val: string) => {
    if (emailMode && onEmailChange) {
      onEmailChange(val);
    } else {
      setQuery(val);
    }
    if (value) onChange(null); // Clear selection when typing
    setIsOpen(val.length >= 2);
    setFocusedIndex(-1);
  };

  // If a person is selected and not in email mode, show a chip
  if (value && !emailMode) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-lg ${className}`}>
        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
          {value.photoUrl ? (
            <img src={value.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <User className="h-3 w-3 text-zinc-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] text-white font-medium truncate">{value.name}</span>
          {value.email && (
            <span className="text-[11px] text-zinc-500 ml-1.5">{value.email}</span>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-zinc-600 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
        <input
          ref={inputRef}
          type="text"
          value={emailMode ? emailValue : query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if ((emailMode ? emailValue : query).length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-[12px] text-white placeholder-zinc-600 focus:outline-none focus:border-amber-600/40 focus:ring-1 focus:ring-amber-600/20 transition-all"
        />
        {isLoading && shouldSearch && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600 animate-spin" />
        )}
      </div>

      {isOpen && shouldSearch && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl overflow-hidden max-h-[240px] overflow-y-auto"
        >
          {results && results.length > 0 ? (
            <>
              {results.map((person, idx) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleSelect(person)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    idx === focusedIndex
                      ? "bg-amber-600/10 text-white"
                      : "hover:bg-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{person.name}</div>
                    <div className="flex items-center gap-1.5">
                      {person.email && (
                        <span className="text-[10px] text-zinc-500 truncate">{person.email}</span>
                      )}
                      {person.organization && (
                        <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                          <Building2 className="h-2.5 w-2.5" />
                          {person.organization}
                        </span>
                      )}
                    </div>
                  </div>
                  {person.title && (
                    <span className="text-[10px] text-zinc-600 flex-shrink-0">{person.title}</span>
                  )}
                </button>
              ))}
            </>
          ) : !isLoading ? (
            <div className="px-3 py-3 text-[11px] text-zinc-600 text-center">
              No contacts found
            </div>
          ) : null}

          {allowCreate && searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (onCreateNew) onCreateNew(searchQuery);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 border-t border-zinc-800/60 text-left transition-colors ${
                focusedIndex === (results?.length ?? 0)
                  ? "bg-amber-600/10 text-amber-400"
                  : "hover:bg-zinc-800/40 text-zinc-500"
              }`}
            >
              <Plus className="h-3 w-3" />
              <span className="text-[11px]">Create new contact &ldquo;{searchQuery}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PersonAutocomplete;
