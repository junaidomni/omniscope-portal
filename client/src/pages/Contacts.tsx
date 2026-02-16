import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, Search, Building2, Mail, Phone, ChevronRight,
  RefreshCw, Plus, UserPlus, MessageSquare, Star, StarOff,
  Filter, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const CATEGORY_COLORS: Record<string, string> = {
  client: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  prospect: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  vendor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function formatRelative(d: string | Date | null) {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function Contacts() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "", email: "", phone: "", organization: "", title: "",
    category: "other" as string,
  });

  const utils = trpc.useUtils();

  const { data: contacts, isLoading } = trpc.contacts.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const syncMutation = trpc.contacts.syncFromMeetings.useMutation({
    onSuccess: (data) => {
      toast.success(`Contacts synced — linked ${data.linked} contacts from ${data.meetings} meetings.`);
      utils.contacts.list.invalidate();
    },
    onError: () => toast.error("Could not sync contacts from meetings."),
  });

  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact created");
      utils.contacts.list.invalidate();
      setShowCreate(false);
      setNewContact({ name: "", email: "", phone: "", organization: "", title: "", category: "other" });
    },
  });

  const toggleStarMutation = trpc.contacts.toggleStar.useMutation({
    onSuccess: () => utils.contacts.list.invalidate(),
  });

  const handleSync = async () => {
    setSyncing(true);
    try { await syncMutation.mutateAsync(); } finally { setSyncing(false); }
  };

  const filtered = useMemo(() => {
    if (!contacts) return [];
    let list = [...contacts];
    
    // Category filter
    if (categoryFilter !== "all") {
      list = list.filter((c: any) => c.category === categoryFilter);
    }
    
    // Starred filter
    if (showStarredOnly) {
      list = list.filter((c: any) => c.starred);
    }
    
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.organization?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
      );
    }
    
    // Sort: starred first, then by name
    list.sort((a: any, b: any) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    
    return list;
  }, [contacts, searchQuery, categoryFilter, showStarredOnly]);

  const stats = useMemo(() => {
    if (!contacts) return { total: 0, starred: 0, clients: 0, prospects: 0 };
    return {
      total: contacts.length,
      starred: contacts.filter((c: any) => c.starred).length,
      clients: contacts.filter((c: any) => c.category === "client").length,
      prospects: contacts.filter((c: any) => c.category === "prospect").length,
    };
  }, [contacts]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48 bg-zinc-800/50" />
          <Skeleton className="h-10 w-64 bg-zinc-800/50 rounded-lg" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Client Contacts</h1>
          </div>
          <p className="text-zinc-400 text-sm">
            {stats.total} contacts — {stats.starred} starred — {stats.clients} clients — {stats.prospects} prospects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Meetings"}
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-yellow-600" />
                  New Contact
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label className="text-zinc-400 text-xs">Name *</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact(p => ({ ...p, name: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    placeholder="Full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs">Email</Label>
                    <Input
                      value={newContact.email}
                      onChange={(e) => setNewContact(p => ({ ...p, email: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Phone</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs">Organization</Label>
                    <Input
                      value={newContact.organization}
                      onChange={(e) => setNewContact(p => ({ ...p, organization: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Title</Label>
                    <Input
                      value={newContact.title}
                      onChange={(e) => setNewContact(p => ({ ...p, title: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      placeholder="Job title"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Category</Label>
                  <Select value={newContact.category} onValueChange={(v) => setNewContact(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
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
                <DialogClose asChild>
                  <Button variant="ghost" className="text-zinc-400">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() => createMutation.mutate({
                    ...newContact,
                    email: newContact.email || undefined,
                    phone: newContact.phone || undefined,
                    organization: newContact.organization || undefined,
                    title: newContact.title || undefined,
                    category: newContact.category as any,
                  })}
                  disabled={!newContact.name.trim() || createMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                >
                  {createMutation.isPending ? "Creating..." : "Create Contact"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search contacts by name, email, organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="prospect">Prospects</SelectItem>
            <SelectItem value="partner">Partners</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showStarredOnly ? "default" : "outline"}
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className={showStarredOnly
            ? "bg-yellow-600 hover:bg-yellow-700 text-black"
            : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          }
        >
          <Star className={`h-4 w-4 mr-2 ${showStarredOnly ? "fill-current" : ""}`} />
          Starred ({stats.starred})
        </Button>
      </div>

      {/* Contact List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm mb-2">
              {searchQuery ? "No contacts match your search" : showStarredOnly ? "No starred contacts" : "No contacts found"}
            </p>
            {!searchQuery && !showStarredOnly && (
              <p className="text-zinc-600 text-xs mb-4">
                Click "Sync from Meetings" to auto-create contacts from your meeting participants
              </p>
            )}
          </div>
        ) : (
          filtered.map((contact: any) => (
            <div key={contact.id} className="flex items-center gap-2">
              {/* Star button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleStarMutation.mutate({ id: contact.id });
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-zinc-800 transition-colors"
              >
                <Star className={`h-4 w-4 ${contact.starred ? "text-yellow-500 fill-yellow-500" : "text-zinc-600 hover:text-zinc-400"}`} />
              </button>

              <Link href={`/contact/${contact.id}`} className="flex-1">
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-yellow-600/30 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="h-11 w-11 rounded-lg bg-yellow-600/15 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-600/25 transition-colors">
                        <span className="text-lg font-bold text-yellow-500">
                          {contact.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors truncate">
                            {contact.name}
                          </p>
                          {contact.category && contact.category !== "other" && (
                            <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[contact.category] || ""}`}>
                              {contact.category}
                            </Badge>
                          )}
                          {contact.organization && (
                            <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs hidden sm:inline-flex">
                              <Building2 className="h-3 w-3 mr-1" />
                              {contact.organization}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                          {contact.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.title && (
                            <span className="hidden md:inline text-zinc-600">{contact.title}</span>
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-medium">{contact.meetingCount || 0}</span>
                            <span className="text-zinc-600">meetings</span>
                          </div>
                          {contact.lastMeetingDate && (
                            <p className="text-xs text-zinc-600 mt-0.5">
                              Last: {formatRelative(contact.lastMeetingDate)}
                            </p>
                          )}
                          {contact.daysSinceLastMeeting && contact.daysSinceLastMeeting > 14 && (
                            <p className="text-xs text-amber-500 mt-0.5">
                              Follow up needed
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-600 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
