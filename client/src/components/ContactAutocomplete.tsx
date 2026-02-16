import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { User, Building2, Mail, Star, X } from "lucide-react";

interface ContactResult {
  id: number;
  name: string;
  email: string | null;
  organization: string | null;
  category: string | null;
  photoUrl: string | null;
}

interface ContactAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (contact: ContactResult) => void;
  placeholder?: string;
  className?: string;
  allowFreeText?: boolean;
}

export function ContactAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Type a name...",
  className = "",
  allowFreeText = false,
}: ContactAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchQuery = query.length >= 1 ? query : undefined;
  const { data: results } = trpc.contacts.searchByName.useQuery(
    { query: searchQuery || "" },
    { enabled: !!searchQuery && isOpen }
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (val.length >= 1) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (contact: ContactResult) => {
    onChange(contact.name);
    setQuery(contact.name);
    setIsOpen(false);
    onSelect?.(contact);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getCategoryColor = (cat: string | null) => {
    switch (cat) {
      case "client": return "text-amber-400";
      case "prospect": return "text-blue-400";
      case "partner": return "text-emerald-400";
      case "vendor": return "text-purple-400";
      default: return "text-zinc-500";
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => { if (query.length >= 1) setIsOpen(true); }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-8 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 ${className}`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && results && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto">
            {results.map((contact: ContactResult) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelect(contact)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
              >
                {contact.photoUrl ? (
                  <img
                    src={contact.photoUrl}
                    alt={contact.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-amber-400">
                      {contact.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {contact.name}
                    </span>
                    {contact.category && (
                      <span className={`text-[10px] uppercase font-semibold ${getCategoryColor(contact.category)}`}>
                        {contact.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {contact.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.organization && (
                      <span className="flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3" />
                        {contact.organization}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {allowFreeText && query && !results.find((r: ContactResult) => r.name.toLowerCase() === query.toLowerCase()) && (
            <div className="border-t border-zinc-700/50 px-3 py-2">
              <button
                type="button"
                onClick={() => { onChange(query); setIsOpen(false); }}
                className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
              >
                Use "{query}" as free text
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && searchQuery && results && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl p-3"
        >
          <p className="text-xs text-zinc-500 text-center">No contacts found for "{query}"</p>
          {allowFreeText && (
            <button
              type="button"
              onClick={() => { onChange(query); setIsOpen(false); }}
              className="mt-1 w-full text-xs text-zinc-400 hover:text-amber-400 transition-colors text-center"
            >
              Use as free text
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Multi-select version for linking multiple contacts
 */
interface ContactMultiSelectProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  className?: string;
}

export function ContactMultiSelect({
  selectedIds,
  onChange,
  placeholder = "Search contacts...",
  className = "",
}: ContactMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: results } = trpc.contacts.searchByName.useQuery(
    { query: query || "a", limit: 20 },
    { enabled: isOpen }
  );

  const { data: allContacts } = trpc.contacts.list.useQuery();

  const selectedContacts = allContacts?.filter((c: any) => selectedIds.includes(c.id)) || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (contact: ContactResult) => {
    if (!selectedIds.includes(contact.id)) {
      onChange([...selectedIds, contact.id]);
    }
    setQuery("");
  };

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  const filteredResults = results?.filter((r: ContactResult) => !selectedIds.includes(r.id)) || [];

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg min-h-[38px]">
        {selectedContacts.map((c: any) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400"
          >
            {c.name}
            <button
              type="button"
              onClick={() => handleRemove(c.id)}
              className="hover:text-amber-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedIds.length === 0 ? placeholder : "Add more..."}
          className={`flex-1 min-w-[100px] bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none ${className}`}
        />
      </div>

      {isOpen && filteredResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto">
            {filteredResults.map((contact: ContactResult) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelect(contact)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-amber-400">
                    {contact.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white truncate">{contact.name}</span>
                  {contact.email && (
                    <span className="ml-2 text-xs text-zinc-500">{contact.email}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
