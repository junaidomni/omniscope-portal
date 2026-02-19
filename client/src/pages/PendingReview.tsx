import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  UserPlus, Building2, Brain, Check, X, Search,
  ChevronDown, ChevronUp, GitMerge, Loader2,
  AlertTriangle, Sparkles, Link2, Briefcase,
  Filter, CheckSquare, Square, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SortField = "name" | "source" | "date";
type SortDir = "asc" | "desc";
type ReviewTab = "contacts" | "companies" | "suggestions";

export default function PendingReview() {
  const [activeTab, setActiveTab] = useState<ReviewTab>("contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [undoStack, setUndoStack] = useState<Array<{ type: string; ids: number[]; action: string; timer: NodeJS.Timeout }>>([]);

  const utils = trpc.useUtils();

  // Data queries
  const { data: allContacts, isLoading: loadingContacts } = trpc.contacts.list.useQuery();
  const { data: allCompanies, isLoading: loadingCompanies } = trpc.companies.list.useQuery({ status: "pending" });
  const { data: suggestions, isLoading: loadingSuggestions } = trpc.contacts.pendingSuggestions.useQuery({ status: "pending" });

  // Mutations
  const approveContactMutation = trpc.triage.approveContact.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); utils.triage.feed.invalidate(); },
  });
  const rejectContactMutation = trpc.triage.rejectContact.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); utils.triage.feed.invalidate(); },
  });
  const bulkApproveContactsMutation = trpc.contacts.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approved} contacts approved`);
      setSelectedContacts(new Set());
      utils.contacts.list.invalidate();
      utils.triage.feed.invalidate();
    },
  });
  const bulkRejectContactsMutation = trpc.contacts.bulkReject.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.rejected} contacts rejected`);
      setSelectedContacts(new Set());
      utils.contacts.list.invalidate();
      utils.triage.feed.invalidate();
    },
  });
  const approveCompanyMutation = trpc.triage.approveCompany.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.triage.feed.invalidate(); },
  });
  const rejectCompanyMutation = trpc.triage.rejectCompany.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.triage.feed.invalidate(); },
  });
  const bulkApproveCompaniesMutation = trpc.triage.bulkApproveCompanies.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approved} companies approved`);
      setSelectedCompanies(new Set());
      utils.companies.list.invalidate();
      utils.triage.feed.invalidate();
    },
  });
  const bulkRejectCompaniesMutation = trpc.triage.bulkRejectCompanies.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.rejected} companies rejected`);
      setSelectedCompanies(new Set());
      utils.companies.list.invalidate();
      utils.triage.feed.invalidate();
    },
  });
  const approveSuggestionMutation = trpc.contacts.approveSuggestion.useMutation({
    onSuccess: () => { utils.contacts.pendingSuggestions.invalidate(); utils.triage.feed.invalidate(); },
  });
  const rejectSuggestionMutation = trpc.contacts.rejectSuggestion.useMutation({
    onSuccess: () => { utils.contacts.pendingSuggestions.invalidate(); utils.triage.feed.invalidate(); },
  });
  const bulkApproveSuggestionsMutation = trpc.contacts.bulkApproveSuggestions.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approved} suggestions approved`);
      setSelectedSuggestions(new Set());
      utils.contacts.pendingSuggestions.invalidate();
      utils.triage.feed.invalidate();
    },
  });
  const bulkRejectSuggestionsMutation = trpc.contacts.bulkRejectSuggestions.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.rejected} suggestions dismissed`);
      setSelectedSuggestions(new Set());
      utils.contacts.pendingSuggestions.invalidate();
      utils.triage.feed.invalidate();
    },
  });

  // Undo helpers
  function showUndoToast(type: string, ids: number[], action: string, undoFn: () => void) {
    const toastId = toast(`${action} ${ids.length} ${type}`, {
      description: "Click Undo to reverse this action",
      action: {
        label: "Undo",
        onClick: () => {
          undoFn();
          toast.dismiss(toastId);
        },
      },
      duration: 5000,
    });
  }

  function handleApproveContact(id: number) {
    approveContactMutation.mutate({ contactId: id });
    showUndoToast("contact", [id], "Approved", () => {
      // Revert to pending
      rejectContactMutation.mutate({ contactId: id }); // Not ideal but reverses
    });
  }

  function handleRejectContact(id: number) {
    rejectContactMutation.mutate({ contactId: id });
    showUndoToast("contact", [id], "Rejected", () => {
      approveContactMutation.mutate({ contactId: id });
    });
  }

  function handleApproveCompany(id: number) {
    approveCompanyMutation.mutate({ companyId: id });
    showUndoToast("company", [id], "Approved", () => {
      rejectCompanyMutation.mutate({ companyId: id });
    });
  }

  function handleRejectCompany(id: number) {
    rejectCompanyMutation.mutate({ companyId: id });
    showUndoToast("company", [id], "Rejected", () => {
      approveCompanyMutation.mutate({ companyId: id });
    });
  }

  function handleApproveSuggestion(id: number) {
    approveSuggestionMutation.mutate({ id });
    toast.success("Suggestion approved");
  }

  function handleRejectSuggestion(id: number) {
    rejectSuggestionMutation.mutate({ id });
    toast.success("Suggestion dismissed");
  }

  // Filter pending contacts
  const pendingContacts = useMemo(() => {
    if (!allContacts) return [];
    let filtered = allContacts.filter((c: any) => c.approvalStatus === "pending");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c: any) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.organization || "").toLowerCase().includes(q)
      );
    }
    filtered.sort((a: any, b: any) => {
      if (sortField === "name") {
        const cmp = (a.name || "").localeCompare(b.name || "");
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortField === "source") {
        const cmp = (a.source || "").localeCompare(b.source || "");
        return sortDir === "asc" ? cmp : -cmp;
      }
      // date
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortDir === "asc" ? dateA - dateB : dateB - dateA;
    });
    return filtered;
  }, [allContacts, searchQuery, sortField, sortDir]);

  // Filter pending companies
  const pendingCompanies = useMemo(() => {
    if (!allCompanies) return [];
    let filtered = allCompanies.filter((c: any) => c.approvalStatus === "pending");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c: any) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.sector || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allCompanies, searchQuery]);

  // Filter suggestions
  const pendingSuggestions = useMemo(() => {
    if (!suggestions) return [];
    if (!searchQuery) return suggestions;
    const q = searchQuery.toLowerCase();
    return suggestions.filter((s: any) =>
      (s.contactName || "").toLowerCase().includes(q) ||
      (s.companyName || "").toLowerCase().includes(q) ||
      (s.type || "").toLowerCase().includes(q)
    );
  }, [suggestions, searchQuery]);

  const tabCounts = {
    contacts: pendingContacts.length,
    companies: pendingCompanies.length,
    suggestions: pendingSuggestions.length,
  };

  const totalPending = tabCounts.contacts + tabCounts.companies + tabCounts.suggestions;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 text-zinc-600" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-yellow-500" />
      : <ChevronDown className="h-3 w-3 text-yellow-500" />;
  }

  // Select-all logic
  function toggleSelectAll(type: ReviewTab) {
    if (type === "contacts") {
      if (selectedContacts.size === pendingContacts.length) {
        setSelectedContacts(new Set());
      } else {
        setSelectedContacts(new Set(pendingContacts.map((c: any) => c.id)));
      }
    } else if (type === "companies") {
      if (selectedCompanies.size === pendingCompanies.length) {
        setSelectedCompanies(new Set());
      } else {
        setSelectedCompanies(new Set(pendingCompanies.map((c: any) => c.id)));
      }
    } else {
      if (selectedSuggestions.size === pendingSuggestions.length) {
        setSelectedSuggestions(new Set());
      } else {
        setSelectedSuggestions(new Set(pendingSuggestions.map((s: any) => s.id)));
      }
    }
  }

  function SelectAllCheckbox({ type, count, selected }: { type: ReviewTab; count: number; selected: number }) {
    const allSelected = count > 0 && selected === count;
    const someSelected = selected > 0 && selected < count;
    return (
      <button onClick={() => toggleSelectAll(type)} className="p-0.5 rounded hover:bg-zinc-800/50 transition-colors">
        {allSelected ? (
          <CheckSquare className="h-4 w-4 text-yellow-500" />
        ) : someSelected ? (
          <Minus className="h-4 w-4 text-yellow-500/60" />
        ) : (
          <Square className="h-4 w-4 text-zinc-600" />
        )}
      </button>
    );
  }

  const isLoading = loadingContacts || loadingCompanies || loadingSuggestions;

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Pending Review</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {totalPending} items awaiting your review
          </p>
        </div>
      </div>

      {/* Search + Tab bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search pending items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900/60 border-zinc-800/60 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-1">
          {(["contacts", "companies", "suggestions"] as ReviewTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab
                  ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "contacts" ? "People" : tab === "companies" ? "Companies" : "Suggestions"}
              {tabCounts[tab] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab ? "bg-yellow-600/30 text-yellow-300" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {((activeTab === "contacts" && selectedContacts.size > 0) ||
        (activeTab === "companies" && selectedCompanies.size > 0) ||
        (activeTab === "suggestions" && selectedSuggestions.size > 0)) && (
        <div className="flex items-center gap-3 bg-yellow-950/20 border border-yellow-800/30 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm text-yellow-400 font-medium">
            {activeTab === "contacts" ? selectedContacts.size : activeTab === "companies" ? selectedCompanies.size : selectedSuggestions.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-emerald-950/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300"
            onClick={() => {
              if (activeTab === "contacts") {
                const ids = Array.from(selectedContacts);
                bulkApproveContactsMutation.mutate({ ids });
                showUndoToast("contacts", ids, "Approved", () => bulkRejectContactsMutation.mutate({ ids }));
              } else if (activeTab === "companies") {
                const ids = Array.from(selectedCompanies);
                bulkApproveCompaniesMutation.mutate({ ids });
                showUndoToast("companies", ids, "Approved", () => bulkRejectCompaniesMutation.mutate({ ids }));
              } else {
                const ids = Array.from(selectedSuggestions);
                bulkApproveSuggestionsMutation.mutate({ ids });
              }
            }}
            disabled={bulkApproveContactsMutation.isPending || bulkApproveCompaniesMutation.isPending || bulkApproveSuggestionsMutation.isPending}
          >
            <Check className="h-3 w-3 mr-1" /> Approve All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-red-950/30 border-red-800/40 text-red-400 hover:bg-red-950/50 hover:text-red-300"
            onClick={() => {
              if (activeTab === "contacts") {
                const ids = Array.from(selectedContacts);
                bulkRejectContactsMutation.mutate({ ids });
                showUndoToast("contacts", ids, "Rejected", () => bulkApproveContactsMutation.mutate({ ids }));
              } else if (activeTab === "companies") {
                const ids = Array.from(selectedCompanies);
                bulkRejectCompaniesMutation.mutate({ ids });
                showUndoToast("companies", ids, "Rejected", () => bulkApproveCompaniesMutation.mutate({ ids }));
              } else {
                const ids = Array.from(selectedSuggestions);
                bulkRejectSuggestionsMutation.mutate({ ids });
              }
            }}
            disabled={bulkRejectContactsMutation.isPending || bulkRejectCompaniesMutation.isPending || bulkRejectSuggestionsMutation.isPending}
          >
            <X className="h-3 w-3 mr-1" /> Reject All
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-500/60" />
          <span className="ml-2 text-sm text-zinc-500">Loading pending items...</span>
        </div>
      )}

      {/* ── CONTACTS TAB ── */}
      {activeTab === "contacts" && !isLoading && (
        <div className="border border-zinc-800/40 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_1fr_120px_100px_100px] gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            <div className="flex items-center">
              <SelectAllCheckbox type="contacts" count={pendingContacts.length} selected={selectedContacts.size} />
            </div>
            <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
              Name <SortIcon field="name" />
            </button>
            <div>Details</div>
            <button onClick={() => toggleSort("source")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
              Source <SortIcon field="source" />
            </button>
            <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
              Added <SortIcon field="date" />
            </button>
            <div className="text-right">Actions</div>
          </div>

          {/* Rows */}
          {pendingContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <UserPlus className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No pending contacts</p>
            </div>
          ) : (
            pendingContacts.map((c: any) => (
              <div
                key={c.id}
                className={`grid grid-cols-[40px_1fr_1fr_120px_100px_100px] gap-2 px-4 py-3 border-b border-zinc-800/20 hover:bg-zinc-900/30 transition-colors items-center ${
                  selectedContacts.has(c.id) ? "bg-yellow-950/10" : ""
                }`}
              >
                <div>
                  <button
                    onClick={() => {
                      const next = new Set(selectedContacts);
                      next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                      setSelectedContacts(next);
                    }}
                    className="p-0.5"
                  >
                    {selectedContacts.has(c.id)
                      ? <CheckSquare className="h-4 w-4 text-yellow-500" />
                      : <Square className="h-4 w-4 text-zinc-600" />
                    }
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate font-medium">{c.name}</p>
                  {c.email && <p className="text-[11px] text-zinc-500 truncate">{c.email}</p>}
                </div>
                <div className="min-w-0">
                  {c.organization && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-zinc-600" /> {c.organization}
                    </span>
                  )}
                  {c.title && <span className="text-[11px] text-zinc-500">{c.title}</span>}
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] border-zinc-700/50 text-zinc-400">
                    {c.source || "unknown"}
                  </Badge>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleApproveContact(c.id)}
                    disabled={approveContactMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-emerald-950/50 text-zinc-500 hover:text-emerald-400 transition-colors"
                    title="Approve"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRejectContact(c.id)}
                    disabled={rejectContactMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Reject"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── COMPANIES TAB ── */}
      {activeTab === "companies" && !isLoading && (
        <div className="border border-zinc-800/40 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_1fr_120px_100px] gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            <div className="flex items-center">
              <SelectAllCheckbox type="companies" count={pendingCompanies.length} selected={selectedCompanies.size} />
            </div>
            <div>Company Name</div>
            <div>Sector</div>
            <div>Source</div>
            <div className="text-right">Actions</div>
          </div>

          {pendingCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <Building2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No pending companies</p>
            </div>
          ) : (
            pendingCompanies.map((c: any) => (
              <div
                key={c.id}
                className={`grid grid-cols-[40px_1fr_1fr_120px_100px] gap-2 px-4 py-3 border-b border-zinc-800/20 hover:bg-zinc-900/30 transition-colors items-center ${
                  selectedCompanies.has(c.id) ? "bg-yellow-950/10" : ""
                }`}
              >
                <div>
                  <button
                    onClick={() => {
                      const next = new Set(selectedCompanies);
                      next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                      setSelectedCompanies(next);
                    }}
                    className="p-0.5"
                  >
                    {selectedCompanies.has(c.id)
                      ? <CheckSquare className="h-4 w-4 text-yellow-500" />
                      : <Square className="h-4 w-4 text-zinc-600" />
                    }
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate font-medium">{c.name}</p>
                </div>
                <div className="min-w-0">
                  {c.sector ? (
                    <Badge variant="outline" className="text-[10px] border-zinc-700/50 text-zinc-400">{c.sector}</Badge>
                  ) : (
                    <span className="text-[11px] text-zinc-600">—</span>
                  )}
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] border-zinc-700/50 text-zinc-400">
                    {c.source || "meeting"}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleApproveCompany(c.id)}
                    disabled={approveCompanyMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-emerald-950/50 text-zinc-500 hover:text-emerald-400 transition-colors"
                    title="Approve"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRejectCompany(c.id)}
                    disabled={rejectCompanyMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Reject"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SUGGESTIONS TAB ── */}
      {activeTab === "suggestions" && !isLoading && (
        <div className="border border-zinc-800/40 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_1fr_120px_80px_100px] gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            <div className="flex items-center">
              <SelectAllCheckbox type="suggestions" count={pendingSuggestions.length} selected={selectedSuggestions.size} />
            </div>
            <div>Type</div>
            <div>Details</div>
            <div>Confidence</div>
            <div>Source</div>
            <div className="text-right">Actions</div>
          </div>

          {pendingSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <Brain className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No pending suggestions</p>
            </div>
          ) : (
            pendingSuggestions.map((s: any) => {
              const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
                company_link: { icon: Link2, label: "Company Link", color: "text-blue-400" },
                enrichment: { icon: Sparkles, label: "Enrichment", color: "text-violet-400" },
                company_enrichment: { icon: Briefcase, label: "Company Data", color: "text-amber-400" },
              };
              const cfg = typeConfig[s.type] || { icon: Brain, label: s.type, color: "text-zinc-400" };
              const Icon = cfg.icon;

              let details = "";
              if (s.type === "company_link") {
                details = `Link ${s.contactName || "contact"} → ${s.suggestedCompanyName || "company"}`;
              } else if (s.type === "enrichment") {
                const data = typeof s.suggestedData === "string" ? JSON.parse(s.suggestedData) : s.suggestedData;
                details = data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ") : "AI enrichment";
              } else if (s.type === "company_enrichment") {
                const data = typeof s.suggestedData === "string" ? JSON.parse(s.suggestedData) : s.suggestedData;
                details = data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ") : "Company data";
              }

              return (
                <div
                  key={s.id}
                  className={`grid grid-cols-[40px_1fr_1fr_120px_80px_100px] gap-2 px-4 py-3 border-b border-zinc-800/20 hover:bg-zinc-900/30 transition-colors items-center ${
                    selectedSuggestions.has(s.id) ? "bg-yellow-950/10" : ""
                  }`}
                >
                  <div>
                    <button
                      onClick={() => {
                        const next = new Set(selectedSuggestions);
                        next.has(s.id) ? next.delete(s.id) : next.add(s.id);
                        setSelectedSuggestions(next);
                      }}
                      className="p-0.5"
                    >
                      {selectedSuggestions.has(s.id)
                        ? <CheckSquare className="h-4 w-4 text-yellow-500" />
                        : <Square className="h-4 w-4 text-zinc-600" />
                      }
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="text-xs text-zinc-300">{cfg.label}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-400 truncate">{details}</p>
                  </div>
                  <div>
                    {s.confidence != null && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.confidence >= 80 ? "bg-emerald-500" : s.confidence >= 50 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${s.confidence}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500">{s.confidence}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500">{s.source || "AI"}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleApproveSuggestion(s.id)}
                      disabled={approveSuggestionMutation.isPending}
                      className="p-1.5 rounded-md hover:bg-emerald-950/50 text-zinc-500 hover:text-emerald-400 transition-colors"
                      title="Approve"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRejectSuggestion(s.id)}
                      disabled={rejectSuggestionMutation.isPending}
                      className="p-1.5 rounded-md hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
