import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Briefcase, Search, Plus, Filter, ChevronRight, Globe,
  Users, Building2, Loader2, TrendingUp, Star, MapPin,
  Shield, AlertCircle, Check, X, Trash2, ChevronDown, ChevronUp,
  Brain, Clock, Zap, Eye
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

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  prospect: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const entityTypeLabels: Record<string, string> = {
  sovereign: "Sovereign",
  private: "Private",
  institutional: "Institutional",
  family_office: "Family Office",
  other: "Other",
};

const riskColors: Record<string, string> = {
  low: "text-emerald-400 border-emerald-500/30",
  medium: "text-yellow-400 border-yellow-500/30",
  high: "text-orange-400 border-orange-500/30",
  critical: "text-red-400 border-red-500/30",
};

function getCompanyInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getCompanyColor(name: string) {
  const colors = [
    "from-yellow-600 to-amber-700", "from-emerald-600 to-green-700",
    "from-blue-600 to-indigo-700", "from-purple-600 to-violet-700",
    "from-rose-600 to-pink-700", "from-cyan-600 to-teal-700",
  ];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
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

export default function Companies() {
  const { isAuthenticated } = useAuth();
  const { data: companies, isLoading } = trpc.companies.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [newCompany, setNewCompany] = useState({
    name: "", domain: "", industry: "", status: "active" as string,
    location: "", entityType: "" as string,
  });

  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Company created");
      utils.companies.list.invalidate();
      setShowCreate(false);
      setNewCompany({ name: "", domain: "", industry: "", status: "active", location: "", entityType: "" });
    },
  });

  const approveMutation = trpc.companies.approve.useMutation({
    onSuccess: () => { toast.success("Company approved"); utils.companies.list.invalidate(); },
  });

  const rejectMutation = trpc.companies.reject.useMutation({
    onSuccess: () => { toast.success("Company rejected"); utils.companies.list.invalidate(); },
  });

  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { toast.success("Company deleted"); utils.companies.list.invalidate(); },
  });

  // Split into pending and approved
  const pendingCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c: any) => c.approvalStatus === "pending");
  }, [companies]);

  const approvedCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c: any) => c.approvalStatus !== "pending" && c.approvalStatus !== "rejected");
  }, [companies]);

  const filtered = useMemo(() => {
    let result = [...approvedCompanies];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c: any) => c.status === statusFilter);
    }
    return result;
  }, [approvedCompanies, search, statusFilter]);

  const stats = useMemo(() => {
    if (!companies) return { total: 0, active: 0, prospects: 0, partners: 0, pending: 0 };
    const approved = approvedCompanies;
    return {
      total: approved.length,
      active: approved.filter((c: any) => c.status === "active").length,
      prospects: approved.filter((c: any) => c.status === "prospect").length,
      partners: approved.filter((c: any) => c.status === "partner").length,
      pending: pendingCompanies.length,
    };
  }, [companies, approvedCompanies, pendingCompanies]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 bg-zinc-800/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-yellow-600" />
            Companies
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{stats.total} organizations in your network</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-yellow-600" /> New Company
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-zinc-400 text-xs">Company Name *</Label>
                <Input value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Company name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-400 text-xs">Domain / Website</Label>
                  <Input value={newCompany.domain} onChange={e => setNewCompany(p => ({ ...p, domain: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="example.com" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Industry</Label>
                  <Input value={newCompany.industry} onChange={e => setNewCompany(p => ({ ...p, industry: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Financial Services" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-400 text-xs">Location</Label>
                  <Input value={newCompany.location} onChange={e => setNewCompany(p => ({ ...p, location: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Dubai, UAE" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Entity Type</Label>
                  <Select value={newCompany.entityType} onValueChange={v => setNewCompany(p => ({ ...p, entityType: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="sovereign">Sovereign</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                      <SelectItem value="family_office">Family Office</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Status</Label>
                <Select value={newCompany.status} onValueChange={v => setNewCompany(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost" className="text-zinc-400">Cancel</Button></DialogClose>
              <Button onClick={() => createMutation.mutate({
                ...newCompany,
                domain: newCompany.domain || undefined,
                industry: newCompany.industry || undefined,
                status: newCompany.status as any,
              })} disabled={!newCompany.name.trim() || createMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Building2, color: "text-yellow-600" },
          { label: "Active", value: stats.active, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Prospects", value: stats.prospects, icon: Search, color: "text-blue-400" },
          { label: "Partners", value: stats.partners, icon: Globe, color: "text-purple-400" },
          { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-zinc-900/50 border-zinc-800 hover:border-yellow-600/20 transition-colors">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Approval Section */}
      {pendingCompanies.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-600/20">
          <CardContent className="pt-3 pb-3">
            <button onClick={() => setShowPending(!showPending)}
              className="w-full flex items-center justify-between text-sm font-medium text-amber-400">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pending Review ({pendingCompanies.length} companies)
              </span>
              {showPending ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showPending && (
              <div className="mt-3 space-y-2">
                {pendingCompanies.map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getCompanyColor(company.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ring-amber-500/30`}>
                        {getCompanyInitials(company.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{company.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{company.industry || company.domain || "Unknown"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link href={`/company/${company.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/20"
                        onClick={() => approveMutation.mutate({ id: company.id })} disabled={approveMutation.isPending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/20"
                        onClick={() => rejectMutation.mutate({ id: company.id })} disabled={rejectMutation.isPending}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder="Search companies by name, domain, industry, or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white">
            <Filter className="h-4 w-4 mr-2 text-zinc-500" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Companies Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          {search ? "No companies match your search" : "No companies yet. Add one to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company: any) => (
            <Card key={company.id} className="bg-zinc-900/60 border-zinc-800 hover:border-yellow-600/40 transition-all group relative">
              <CardContent className="pt-4 pb-3.5">
                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                      onClick={e => e.stopPropagation()}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800" onClick={e => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete {company.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This will permanently remove this company and unlink all associated contacts. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate({ id: company.id })}
                        className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Link href={`/company/${company.id}`}>
                  <div className="cursor-pointer">
                    {/* Company Header */}
                    <div className="flex items-center gap-3 mb-3">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="w-11 h-11 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getCompanyColor(company.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {getCompanyInitials(company.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-yellow-400 transition-colors">
                          {company.name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {company.industry || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Tags Row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <Badge variant="outline" className={`text-[10px] ${statusColors[company.status] || statusColors.active}`}>
                        {company.status}
                      </Badge>
                      {company.entityType && (
                        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
                          {entityTypeLabels[company.entityType] || company.entityType}
                        </Badge>
                      )}
                      {company.jurisdictionRisk && (
                        <Badge variant="outline" className={`text-[10px] ${riskColors[company.jurisdictionRisk]}`}>
                          <Shield className="h-2.5 w-2.5 mr-0.5" /> {company.jurisdictionRisk}
                        </Badge>
                      )}
                      {company.internalRating && (
                        <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/30">
                          {"★".repeat(company.internalRating)}
                        </Badge>
                      )}
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      {company.location && (
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{company.location}</span>
                      )}
                      {company.domain && (
                        <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{company.domain}</span>
                      )}
                      {company.owner && (
                        <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{company.owner}</span>
                      )}
                    </div>

                    {/* AI Summary Preview */}
                    {company.aiMemory && (
                      <div className="mt-2.5 p-2 bg-zinc-800/30 rounded border border-zinc-800/50">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-2.5 w-2.5 text-yellow-600" />
                          <span className="text-[9px] text-yellow-600 uppercase font-medium">Intelligence</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{company.aiMemory}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/50">
                      <span className="text-[10px] text-zinc-600">
                        <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                        {timeAgo(company.updatedAt)}
                      </span>
                      <span className="text-[10px] text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        View Profile <ChevronRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
