import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Users, Star, Search, Plus, RefreshCw, Building2, Mail, Phone,
  Calendar, Clock, Filter, ChevronRight, Briefcase,
  Globe, Sparkles, UserPlus, Loader2, Check, X, AlertCircle,
  Zap, Shield, Brain, MessageCircle, CheckSquare, FileText,
  ChevronDown, ChevronUp, Trash2, Merge, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const categoryColors: Record<string, string> = {
  client: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  prospect: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  vendor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const healthColors: Record<string, { dot: string; text: string; label: string }> = {
  strong: { dot: "bg-emerald-500", text: "text-emerald-400", label: "Strong" },
  warm: { dot: "bg-yellow-500", text: "text-yellow-400", label: "Warm" },
  cold: { dot: "bg-red-500", text: "text-red-400", label: "Cold" },
  new: { dot: "bg-blue-500", text: "text-blue-400", label: "New" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "from-yellow-600 to-amber-700", "from-emerald-600 to-green-700",
    "from-blue-600 to-indigo-700", "from-purple-600 to-violet-700",
    "from-rose-600 to-pink-700", "from-cyan-600 to-teal-700",
  ];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}

function getRelationshipHealth(days: number | null, meetingCount: number): keyof typeof healthColors {
  if (meetingCount === 0) return "new";
  if (days === null) return "cold";
  if (days <= 14) return "strong";
  if (days <= 45) return "warm";
  return "cold";
}

function timeAgo(date: string | Date | null) {
  if (!date) return "Never";
  const diffDays = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Contacts() {
  const { isAuthenticated } = useAuth();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [showPending, setShowPending] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", organization: "", title: "", category: "other" as string });

  // Selected contact profile
  const { data: selectedProfile, isLoading: profileLoading } = trpc.contacts.getProfile.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const { data: selectedNotes = [] } = trpc.contacts.getNotes.useQuery(
    { contactId: selectedId! },
    { enabled: !!selectedId }
  );

  const { data: interactions = [] } = trpc.interactions.list.useQuery(
    { contactId: selectedId!, limit: 20 },
    { enabled: !!selectedId }
  );

  const syncMutation = trpc.contacts.syncFromMeetings.useMutation({
    onSuccess: (result: any) => {
      toast.success(`Synced ${result.created || 0} new contacts, ${result.linked || 0} meeting links`);
      utils.contacts.list.invalidate();
    },
  });

  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Relationship created");
      utils.contacts.list.invalidate();
      setShowCreate(false);
      setNewContact({ name: "", email: "", phone: "", organization: "", title: "", category: "other" });
    },
  });

  const approveMutation = trpc.contacts.approve.useMutation({
    onSuccess: () => {
      toast.success("Contact approved");
      utils.contacts.list.invalidate();
    },
  });

  const rejectMutation = trpc.contacts.reject.useMutation({
    onSuccess: () => {
      toast.success("Contact rejected");
      utils.contacts.list.invalidate();
      if (selectedId) setSelectedId(null);
    },
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted");
      utils.contacts.list.invalidate();
      setSelectedId(null);
    },
  });

  const bulkApproveMutation = trpc.contacts.bulkApprove.useMutation({
    onSuccess: (result: any) => {
      toast.success(`Approved ${result.count} contacts`);
      utils.contacts.list.invalidate();
    },
  });

  const toggleStarMutation = trpc.contacts.toggleStar.useMutation({
    onSuccess: () => {
      utils.contacts.list.invalidate();
      if (selectedId) utils.contacts.getProfile.invalidate({ id: selectedId });
    },
  });

  // Split contacts into pending and approved
  const pendingContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c: any) => c.approvalStatus === "pending");
  }, [contacts]);

  const approvedContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c: any) => c.approvalStatus !== "pending" && c.approvalStatus !== "rejected");
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = [...approvedContacts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.organization?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      if (categoryFilter === "starred") {
        result = result.filter((c: any) => c.starred);
      } else {
        result = result.filter((c: any) => c.category === categoryFilter);
      }
    }
    if (healthFilter !== "all") {
      result = result.filter((c: any) => {
        const health = getRelationshipHealth(c.daysSinceLastMeeting, c.meetingCount || 0);
        return health === healthFilter;
      });
    }
    result.sort((a: any, b: any) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return (b.meetingCount || 0) - (a.meetingCount || 0);
    });
    return result;
  }, [approvedContacts, search, categoryFilter, healthFilter]);

  // Auto-select first contact
  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const stats = useMemo(() => {
    if (!contacts) return { total: 0, pending: 0, strong: 0, warm: 0, cold: 0 };
    const approved = contacts.filter((c: any) => c.approvalStatus !== "pending" && c.approvalStatus !== "rejected");
    return {
      total: approved.length,
      pending: pendingContacts.length,
      strong: approved.filter((c: any) => getRelationshipHealth(c.daysSinceLastMeeting, c.meetingCount || 0) === "strong").length,
      warm: approved.filter((c: any) => getRelationshipHealth(c.daysSinceLastMeeting, c.meetingCount || 0) === "warm").length,
      cold: approved.filter((c: any) => getRelationshipHealth(c.daysSinceLastMeeting, c.meetingCount || 0) === "cold").length,
    };
  }, [contacts, pendingContacts]);

  const selectedContact = useMemo(() => {
    if (!selectedId || !contacts) return null;
    return contacts.find((c: any) => c.id === selectedId) || null;
  }, [selectedId, contacts]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="w-80 border-r border-zinc-800 p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 bg-zinc-800/50 rounded-lg" />)}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-48 bg-zinc-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — Clean Searchable People List
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/50 flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-600" />
              Relationships
            </h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-yellow-500">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-yellow-600" /> New Relationship
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label className="text-zinc-400 text-xs">Name *</Label>
                      <Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Full name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-zinc-400 text-xs">Email</Label>
                        <Input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="email@example.com" />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Phone</Label>
                        <Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-zinc-400 text-xs">Organization</Label>
                        <Input value={newContact.organization} onChange={e => setNewContact(p => ({ ...p, organization: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Company name" />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Title</Label>
                        <Input value={newContact.title} onChange={e => setNewContact(p => ({ ...p, title: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Job title" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Category</Label>
                      <Select value={newContact.category} onValueChange={v => setNewContact(p => ({ ...p, category: v }))}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" className="text-zinc-400">Cancel</Button></DialogClose>
                    <Button onClick={() => createMutation.mutate({
                      ...newContact,
                      email: newContact.email || undefined,
                      phone: newContact.phone || undefined,
                      organization: newContact.organization || undefined,
                      title: newContact.title || undefined,
                      category: newContact.category as any,
                    })} disabled={!newContact.name.trim() || createMutation.isPending}
                      className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold">
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input placeholder="Search people..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            {["all", "client", "prospect", "partner", "vendor", "starred"].map(f => (
              <button key={f} onClick={() => setCategoryFilter(f)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${
                  categoryFilter === f
                    ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/40"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                }`}>
                {f === "all" ? "All" : f === "starred" ? "★ Starred" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Health filter */}
          <div className="flex gap-1.5">
            {(["all", "strong", "warm", "cold"] as const).map(h => (
              <button key={h} onClick={() => setHealthFilter(h)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border flex items-center gap-1 ${
                  healthFilter === h
                    ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/40"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                }`}>
                {h !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${healthColors[h].dot}`} />}
                {h === "all" ? "All Health" : healthColors[h].label}
              </button>
            ))}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span>{stats.total} people</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{stats.strong}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />{stats.warm}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{stats.cold}</span>
            {stats.pending > 0 && <span className="text-amber-400 font-medium">{stats.pending} pending</span>}
          </div>
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto">
          {/* Pending Approval Section */}
          {pendingContacts.length > 0 && (
            <div className="border-b border-zinc-800">
              <button onClick={() => setShowPending(!showPending)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-amber-400 hover:bg-zinc-900/50">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Pending Review ({pendingContacts.length})
                </span>
                {showPending ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showPending && (
                <div>
                  <div className="px-4 pb-1.5">
                    <Button size="sm" variant="outline"
                      className="h-6 text-[10px] border-amber-600/30 text-amber-400 hover:bg-amber-600/10 w-full"
                      onClick={() => bulkApproveMutation.mutate({ ids: pendingContacts.map((c: any) => c.id) })}
                      disabled={bulkApproveMutation.isPending}>
                      <Check className="h-3 w-3 mr-1" /> Approve All
                    </Button>
                  </div>
                  {pendingContacts.map((contact: any) => (
                    <div key={contact.id}
                      className={`px-4 py-2.5 border-l-2 border-amber-500/50 hover:bg-zinc-900/50 cursor-pointer transition-colors ${
                        selectedId === contact.id ? "bg-zinc-900/80 border-l-amber-500" : ""
                      }`}
                      onClick={() => setSelectedId(contact.id)}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(contact.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ring-amber-500/30`}>
                          {getInitials(contact.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white truncate">{contact.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{contact.companyName || contact.organization || "Unknown org"}</div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); approveMutation.mutate({ id: contact.id }); }}
                            className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400" title="Approve">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); rejectMutation.mutate({ id: contact.id }); }}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400" title="Reject">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approved contacts list */}
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-zinc-600 text-sm">
              {search ? "No matches found" : "No relationships yet"}
            </div>
          ) : (
            filtered.map((contact: any) => {
              const health = getRelationshipHealth(contact.daysSinceLastMeeting, contact.meetingCount || 0);
              return (
                <div key={contact.id}
                  className={`px-4 py-2.5 hover:bg-zinc-900/50 cursor-pointer transition-colors border-b border-zinc-800/30 ${
                    selectedId === contact.id ? "bg-zinc-900/80 border-l-2 border-l-yellow-600" : "border-l-2 border-l-transparent"
                  }`}
                  onClick={() => setSelectedId(contact.id)}>
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(contact.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {getInitials(contact.name)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${healthColors[health].dot}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-white truncate">{contact.name}</span>
                        {contact.starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {contact.companyName || contact.organization || contact.title || "—"}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-zinc-500">{timeAgo(contact.lastMeetingDate)}</div>
                      {contact.category && contact.category !== "other" && (
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 mt-0.5 ${categoryColors[contact.category]}`}>
                          {contact.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CENTER PANEL — Relationship Card (The Brain)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">
        {!selectedContact ? (
          <div className="flex items-center justify-center h-full text-zinc-600">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
              <p className="text-sm">Select a person to view their profile</p>
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getAvatarColor(selectedContact.name)} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                {getInitials(selectedContact.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white truncate">{selectedContact.name}</h2>
                  <button onClick={() => toggleStarMutation.mutate({ id: selectedContact.id })}>
                    <Star className={`h-5 w-5 ${selectedContact.starred ? "text-yellow-500 fill-yellow-500" : "text-zinc-600 hover:text-yellow-500"}`} />
                  </button>
                  {selectedContact.approvalStatus === "pending" && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  {selectedContact.title && <span>{selectedContact.title}</span>}
                  {selectedContact.title && (selectedContact.companyName || selectedContact.organization) && <span className="text-zinc-600">at</span>}
                  {(selectedContact.companyName || selectedContact.organization) && (
                    <Link href={selectedContact.companyId ? `/company/${selectedContact.companyId}` : "#"}>
                      <span className="text-yellow-500 hover:text-yellow-400 cursor-pointer">
                        {selectedContact.companyName || selectedContact.organization}
                      </span>
                    </Link>
                  )}
                </div>
                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {selectedContact.category && selectedContact.category !== "other" && (
                    <Badge variant="outline" className={`text-[10px] ${categoryColors[selectedContact.category]}`}>
                      {selectedContact.category}
                    </Badge>
                  )}
                  {(() => {
                    const health = getRelationshipHealth(selectedContact.daysSinceLastMeeting, selectedContact.meetingCount || 0);
                    return (
                      <Badge variant="outline" className={`text-[10px] ${healthColors[health].text} border-current/30`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${healthColors[health].dot} mr-1`} />
                        {healthColors[health].label}
                      </Badge>
                    );
                  })()}
                  {selectedContact.influenceWeight && (
                    <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
                      {selectedContact.influenceWeight.replace("_", " ")}
                    </Badge>
                  )}
                  {selectedContact.riskTier && (
                    <Badge variant="outline" className={`text-[10px] ${
                      selectedContact.riskTier === "critical" ? "text-red-400 border-red-500/30" :
                      selectedContact.riskTier === "high" ? "text-orange-400 border-orange-500/30" :
                      selectedContact.riskTier === "medium" ? "text-yellow-400 border-yellow-500/30" :
                      "text-emerald-400 border-emerald-500/30"
                    }`}>
                      <Shield className="h-2.5 w-2.5 mr-0.5" /> {selectedContact.riskTier} risk
                    </Badge>
                  )}
                  {selectedContact.complianceStage && selectedContact.complianceStage !== "not_started" && (
                    <Badge variant="outline" className={`text-[10px] ${
                      selectedContact.complianceStage === "cleared" ? "text-emerald-400 border-emerald-500/30" :
                      selectedContact.complianceStage === "flagged" ? "text-red-400 border-red-500/30" :
                      "text-blue-400 border-blue-500/30"
                    }`}>
                      {selectedContact.complianceStage.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link href={`/contact/${selectedContact.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="Full Profile">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete {selectedContact.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This will permanently remove this person and all their associated data (notes, documents, interactions, meeting links). This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate({ id: selectedContact.id })}
                        className="bg-red-600 hover:bg-red-700 text-white">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/contact/${selectedContact.id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <MessageCircle className="h-3 w-3 mr-1.5" /> Add Note
                </Button>
              </Link>
              <Link href="/todo">
                <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <CheckSquare className="h-3 w-3 mr-1.5" /> Add Task
                </Button>
              </Link>
              {selectedContact.email && (
                <a href={`mailto:${selectedContact.email}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <Mail className="h-3 w-3 mr-1.5" /> Email
                  </Button>
                </a>
              )}
              {selectedContact.phone && (
                <a href={`tel:${selectedContact.phone}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <Phone className="h-3 w-3 mr-1.5" /> Call
                  </Button>
                </a>
              )}
            </div>

            {/* Snapshot Section */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-4 pb-4">
                {/* AI Summary */}
                {(selectedProfile?.aiSummary || selectedProfile?.aiMemory) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="h-3.5 w-3.5 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-600 uppercase tracking-wider">Intelligence Summary</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {selectedProfile?.aiSummary || selectedProfile?.aiMemory?.substring(0, 300)}
                      {(selectedProfile?.aiMemory?.length || 0) > 300 && "..."}
                    </p>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-lg font-bold text-white">{selectedProfile?.meetingCount || selectedContact.meetingCount || 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Meetings</div>
                  </div>
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-lg font-bold text-white">{selectedProfile?.openTaskCount || 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Open Tasks</div>
                  </div>
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-lg font-bold text-white">{selectedNotes.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Notes</div>
                  </div>
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm font-bold text-white">{timeAgo(selectedContact.lastMeetingDate)}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Last Seen</div>
                  </div>
                </div>

                {/* Contact details (minimal) */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {selectedContact.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selectedContact.email}</span>
                  )}
                  {selectedContact.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedContact.phone}</span>
                  )}
                  {selectedContact.source && (
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" />via {selectedContact.source}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
              </div>
              <div className="space-y-2">
                {/* Recent meetings */}
                {selectedProfile?.meetings?.slice(0, 5).map((m: any) => (
                  <Link key={m.meeting.id} href={`/meeting/${m.meeting.id}`}>
                    <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{m.meeting.meetingTitle || "Meeting"}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{formatDate(m.meeting.meetingDate)}</div>
                        {m.meeting.executiveSummary && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{m.meeting.executiveSummary}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Recent interactions */}
                {interactions.slice(0, 5).filter((i: any) => i.type !== "meeting").map((interaction: any) => (
                  <div key={interaction.id} className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white">{interaction.type}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{formatDate(interaction.timestamp)}</div>
                      {interaction.summary && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{interaction.summary}</p>
                      )}
                    </div>
                  </div>
                ))}

                {(!selectedProfile?.meetings?.length && interactions.length === 0) && (
                  <div className="text-center py-6 text-zinc-600 text-sm">
                    No activity recorded yet
                  </div>
                )}

                {/* View full profile link */}
                {(selectedProfile?.meetings?.length || 0) > 5 && (
                  <Link href={`/contact/${selectedContact.id}`}>
                    <div className="text-center py-2">
                      <span className="text-xs text-yellow-500 hover:text-yellow-400 cursor-pointer">
                        View all {selectedProfile?.meetingCount} meetings →
                      </span>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Notes */}
            {selectedNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-white">Recent Notes</h3>
                </div>
                <div className="space-y-2">
                  {selectedNotes.slice(0, 3).map((note: any) => (
                    <div key={note.id} className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-300">{note.content}</p>
                      <div className="text-[10px] text-zinc-600 mt-1.5">
                        {note.createdByName} · {formatDate(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Intelligence & Suggested Actions
         ═══════════════════════════════════════════════════════════════════ */}
      {selectedContact && (
        <div className="w-72 border-l border-zinc-800 flex-shrink-0 overflow-y-auto bg-zinc-950/50 hidden xl:block">
          <div className="p-4 space-y-4">
            {/* Suggested Next Move */}
            {selectedProfile?.aiMemory && (
              <div className="p-3 bg-yellow-600/5 border border-yellow-600/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-medium text-yellow-500">Suggested Next Move</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {(() => {
                    const days = selectedContact.daysSinceLastMeeting;
                    if (days === null || days > 45) return "Reconnect — no interaction in 45+ days. Schedule a check-in call.";
                    if (days > 21) return "Follow up — it's been over 3 weeks since last contact. Send a brief update.";
                    if ((selectedProfile?.openTaskCount || 0) > 0) return `Complete ${selectedProfile?.openTaskCount} open task${(selectedProfile?.openTaskCount || 0) > 1 ? "s" : ""} related to this relationship.`;
                    return "Relationship is active. Continue current engagement cadence.";
                  })()}
                </p>
              </div>
            )}

            {/* Intelligence Layer */}
            {selectedProfile?.aiMemory && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">AI Memory</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {selectedProfile.aiMemory}
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Details</span>
              <div className="mt-2 space-y-2">
                {selectedContact.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3 text-zinc-600" />
                    <span className="text-zinc-400 truncate">{selectedContact.email}</span>
                  </div>
                )}
                {selectedContact.phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-3 w-3 text-zinc-600" />
                    <span className="text-zinc-400">{selectedContact.phone}</span>
                  </div>
                )}
                {(selectedContact.companyName || selectedContact.organization) && (
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3 w-3 text-zinc-600" />
                    <span className="text-zinc-400">{selectedContact.companyName || selectedContact.organization}</span>
                  </div>
                )}
                {selectedContact.website && (
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="h-3 w-3 text-zinc-600" />
                    <a href={selectedContact.website} target="_blank" className="text-yellow-500 hover:text-yellow-400 truncate">
                      {selectedContact.website}
                    </a>
                  </div>
                )}
                {selectedContact.introducerSource && (
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3 w-3 text-zinc-600" />
                    <span className="text-zinc-400">Introduced by: {selectedContact.introducerSource}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Open Tasks */}
            {selectedProfile?.tasks && selectedProfile.tasks.filter((t: any) => t.status !== "completed").length > 0 && (
              <div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Open Tasks</span>
                <div className="mt-2 space-y-1.5">
                  {selectedProfile.tasks.filter((t: any) => t.status !== "completed").slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-start gap-2 text-xs p-2 bg-zinc-900/30 rounded">
                      <CheckSquare className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-300 line-clamp-2">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Profile Link */}
            <Link href={`/contact/${selectedContact.id}`}>
              <Button variant="outline" size="sm" className="w-full text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 mt-2">
                <Eye className="h-3 w-3 mr-1.5" /> Open Full Dossier
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
