import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRoute, Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  Building2, Users, Calendar, Sparkles, ChevronLeft, Globe,
  Edit3, Save, X, Briefcase, MessageSquare, Clock, FileText,
  TrendingUp, Loader2, RefreshCw, CheckSquare, Trash2, MapPin,
  Shield, Star, Target, ChevronRight, Mail, Phone, AlertTriangle,
  Landmark, Eye, UserCheck, Zap, ArrowLeft, MoreHorizontal,
  ChevronDown, ChevronUp, Brain, ExternalLink, Copy, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Streamdown } from "streamdown";
import { ContactAutocomplete } from "@/components/ContactAutocomplete";

/* ── Constants ── */
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  prospect: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  partner: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};
const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
};
const ENTITY_LABELS: Record<string, string> = {
  sovereign: "Sovereign", private: "Private", institutional: "Institutional",
  family_office: "Family Office", other: "Other",
};
const interactionIcons: Record<string, any> = {
  meeting: Calendar, note: MessageSquare, doc_shared: FileText,
  task_update: CheckSquare, email: Mail, call: Phone, intro: Users,
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function getInitialColor(name: string) {
  const colors = [
    "from-yellow-600 to-amber-700", "from-emerald-600 to-green-700",
    "from-blue-600 to-indigo-700", "from-purple-600 to-violet-700",
    "from-rose-600 to-pink-700", "from-cyan-600 to-teal-700",
  ];
  return colors[(name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}
function timeAgo(date: string | Date | null) {
  if (!date) return "—";
  const diffDays = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Main Component ── */
export default function CompanyProfile() {
  const [, params] = useRoute("/company/:id");
  const companyId = Number(params?.id);
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: profile, isLoading, refetch } = trpc.companies.getProfile.useQuery(
    { id: companyId }, { enabled: isAuthenticated && !!companyId }
  );

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => { toast.success("Company updated"); setEditing(false); refetch(); },
    onError: () => toast.error("Failed to update"),
  });
  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { toast.success("Company deleted"); navigate("/companies"); },
    onError: () => toast.error("Failed to delete company"),
  });
  const refreshAiMutation = trpc.companies.refreshAiMemory.useMutation({
    onSuccess: () => { toast.success("AI Memory refreshed"); refetch(); },
    onError: () => toast.error("Failed to refresh AI Memory"),
  });

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [linkSearch, setLinkSearch] = useState("");
  const [showIntel, setShowIntel] = useState(true);

  const updateContactMutation = trpc.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contact linked"); setLinkSearch(""); utils.companies.getProfile.invalidate({ id: companyId }); },
    onError: () => toast.error("Failed to link contact"),
  });

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="h-48 bg-gradient-to-b from-zinc-800/50 to-black" />
        <div className="max-w-7xl mx-auto px-6 -mt-20">
          <div className="flex gap-6">
            <Skeleton className="h-28 w-28 rounded-2xl bg-zinc-800/50 flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-4">
              <Skeleton className="h-8 w-64 bg-zinc-800/50" />
              <Skeleton className="h-5 w-48 bg-zinc-800/50" />
              <Skeleton className="h-4 w-96 bg-zinc-800/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 min-h-screen bg-black">
        <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          <Building2 className="h-10 w-10 text-zinc-700" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Company not found</h2>
        <p className="text-zinc-500 mb-8">This company may have been removed or the ID is invalid.</p>
        <Link href="/companies">
          <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  const startEdit = () => {
    setEditData({
      name: profile.name, domain: profile.domain || "", industry: profile.industry || "",
      status: profile.status, notes: profile.notes || "", owner: profile.owner || "",
      location: (profile as any).location || "", internalRating: (profile as any).internalRating ?? "",
      jurisdictionRisk: (profile as any).jurisdictionRisk || "",
      bankingPartner: (profile as any).bankingPartner || "", custodian: (profile as any).custodian || "",
      regulatoryExposure: (profile as any).regulatoryExposure || "",
      entityType: (profile as any).entityType || "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    const updates: any = { id: companyId };
    for (const [key, value] of Object.entries(editData)) {
      if (key === "status" || key === "jurisdictionRisk" || key === "entityType") {
        updates[key] = value || undefined;
      } else if (key === "internalRating") {
        updates[key] = value !== "" ? Number(value) : null;
      } else {
        updates[key] = (value as string)?.trim() || undefined;
      }
    }
    updateMutation.mutate(updates);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const p = profile as any;
  const lastActivity = profile.interactions?.length > 0 ? profile.interactions[0]?.timestamp : null;
  const daysSinceActivity = lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000) : null;
  const healthColor = daysSinceActivity === null ? "bg-zinc-600" : daysSinceActivity > 14 ? "bg-red-500" : daysSinceActivity > 7 ? "bg-amber-500" : "bg-emerald-500";
  const healthLabel = daysSinceActivity === null ? "No activity" : daysSinceActivity === 0 ? "Active today" : daysSinceActivity === 1 ? "Active yesterday" : `${daysSinceActivity}d since last activity`;
  const healthTextColor = daysSinceActivity === null ? "text-zinc-500" : daysSinceActivity > 14 ? "text-red-400" : daysSinceActivity > 7 ? "text-amber-400" : "text-emerald-400";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-black">
        {/* ═══════ HERO HEADER ═══════ */}
        <div className="relative">
          {/* Gradient backdrop */}
          <div className="absolute inset-0 h-56 bg-gradient-to-b from-zinc-900/80 via-zinc-950/50 to-black" />
          <div className="absolute inset-0 h-56 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-600/5 via-transparent to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 pt-6">
            {/* Navigation bar */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/companies">
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white -ml-2 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Companies</span>
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={startEdit}
                    className="border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 bg-transparent h-9">
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-zinc-500 h-9">Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}
                      className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold h-9">
                      <Save className="h-3.5 w-3.5 mr-1.5" />{updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-zinc-600 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 w-48">
                    <DropdownMenuItem onClick={() => refreshAiMutation.mutate({ id: companyId })} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                      <Sparkles className="h-4 w-4 mr-2 text-yellow-600" />{profile.aiMemory ? "Regenerate AI Memory" : "Generate AI Memory"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" />Delete Company
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Company</AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete {profile.name}? All interactions will be removed and linked contacts will be unlinked.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ id: companyId })} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ═══════ IDENTITY CARD ═══════ */}
            {editing ? (
              /* ── EDIT MODE ── */
              <Card className="bg-zinc-900/80 border-zinc-800/80 backdrop-blur-sm mb-8">
                <div className="h-1 bg-gradient-to-r from-yellow-600/80 via-yellow-500/60 to-yellow-600/80" />
                <CardContent className="p-8">
                  <h3 className="text-xs font-semibold text-yellow-600 uppercase tracking-[0.15em] mb-6">Edit Company</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label className="text-zinc-500 text-xs font-medium">Company Name</Label>
                      <Input value={editData.name} onChange={e => setEditData((p: any) => ({ ...p, name: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" /></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Domain</Label>
                      <Input value={editData.domain} onChange={e => setEditData((p: any) => ({ ...p, domain: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" placeholder="example.com" /></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Industry</Label>
                      <Input value={editData.industry} onChange={e => setEditData((p: any) => ({ ...p, industry: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div><Label className="text-zinc-500 text-xs font-medium">Status</Label>
                      <Select value={editData.status} onValueChange={v => setEditData((p: any) => ({ ...p, status: v }))}>
                        <SelectTrigger className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="active">Active</SelectItem><SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Owner</Label>
                      <Input value={editData.owner} onChange={e => setEditData((p: any) => ({ ...p, owner: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" /></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Location</Label>
                      <Input value={editData.location} onChange={e => setEditData((p: any) => ({ ...p, location: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" placeholder="Dubai, UAE" /></div>
                  </div>

                  <Separator className="bg-zinc-800/60 my-6" />
                  <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-[0.15em] mb-4">Strategic Intelligence</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label className="text-zinc-500 text-xs font-medium">Entity Type</Label>
                      <Select value={editData.entityType || "none"} onValueChange={v => setEditData((p: any) => ({ ...p, entityType: v === "none" ? "" : v }))}>
                        <SelectTrigger className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="none">Not Set</SelectItem><SelectItem value="sovereign">Sovereign</SelectItem>
                          <SelectItem value="private">Private</SelectItem><SelectItem value="institutional">Institutional</SelectItem>
                          <SelectItem value="family_office">Family Office</SelectItem><SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Jurisdiction Risk</Label>
                      <Select value={editData.jurisdictionRisk || "none"} onValueChange={v => setEditData((p: any) => ({ ...p, jurisdictionRisk: v === "none" ? "" : v }))}>
                        <SelectTrigger className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="none">Not Set</SelectItem><SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Internal Rating (1-5)</Label>
                      <Input type="number" min={1} max={5} value={editData.internalRating} onChange={e => setEditData((p: any) => ({ ...p, internalRating: e.target.value }))}
                        className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" placeholder="1-5" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><Label className="text-zinc-500 text-xs font-medium">Banking Partner</Label>
                      <Input value={editData.bankingPartner} onChange={e => setEditData((p: any) => ({ ...p, bankingPartner: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" /></div>
                    <div><Label className="text-zinc-500 text-xs font-medium">Custodian</Label>
                      <Input value={editData.custodian} onChange={e => setEditData((p: any) => ({ ...p, custodian: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5" /></div>
                  </div>
                  <div className="mt-4"><Label className="text-zinc-500 text-xs font-medium">Regulatory Exposure</Label>
                    <Textarea value={editData.regulatoryExposure} onChange={e => setEditData((p: any) => ({ ...p, regulatoryExposure: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5 min-h-[60px]" placeholder="OFAC, sanctions, PEP exposure..." /></div>
                  <div className="mt-4"><Label className="text-zinc-500 text-xs font-medium">Notes</Label>
                    <Textarea value={editData.notes} onChange={e => setEditData((p: any) => ({ ...p, notes: e.target.value }))} className="bg-zinc-800/60 border-zinc-700/50 text-white mt-1.5 min-h-[80px]" /></div>
                </CardContent>
              </Card>
            ) : (
              /* ── VIEW MODE ── */
              <div className="flex items-start gap-6 mb-8">
                {/* Logo / Avatar */}
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt={profile.name} className="w-28 h-28 rounded-2xl object-cover flex-shrink-0 shadow-2xl shadow-black/50 ring-1 ring-white/5" />
                ) : (
                  <div className={`h-28 w-28 rounded-2xl bg-gradient-to-br ${getInitialColor(profile.name)} flex items-center justify-center flex-shrink-0 shadow-2xl shadow-black/50 ring-1 ring-white/5`}>
                    <span className="text-3xl font-bold text-white/90">{getInitials(profile.name)}</span>
                  </div>
                )}

                {/* Identity */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1.5">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{profile.name}</h1>
                    <Badge variant="outline" className={`${STATUS_COLORS[profile.status] || ""} text-xs font-medium`}>{profile.status}</Badge>
                    {p.entityType && (
                      <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700/50 text-xs"><Landmark className="h-3 w-3 mr-1" />{ENTITY_LABELS[p.entityType] || p.entityType}</Badge>
                    )}
                    {p.jurisdictionRisk && (
                      <Badge variant="outline" className={`${RISK_COLORS[p.jurisdictionRisk] || ""} text-xs`}><Shield className="h-3 w-3 mr-1" />{p.jurisdictionRisk} risk</Badge>
                    )}
                  </div>

                  {/* Industry + Domain + Location */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mb-2">
                    {profile.industry && (
                      <span className="flex items-center gap-1.5 text-zinc-400"><Briefcase className="h-3.5 w-3.5 text-zinc-600" />{profile.industry}</span>
                    )}
                    {profile.domain && (
                      <a href={`https://${profile.domain}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-yellow-500 transition-colors group">
                        <Globe className="h-3.5 w-3.5 text-zinc-600 group-hover:text-yellow-600" />{profile.domain}
                        <ExternalLink className="h-3 w-3 text-zinc-700 group-hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {p.location && (
                      <span className="flex items-center gap-1.5 text-zinc-400"><MapPin className="h-3.5 w-3.5 text-zinc-600" />{p.location}</span>
                    )}
                    {profile.owner && (
                      <span className="flex items-center gap-1.5 text-zinc-500"><UserCheck className="h-3.5 w-3.5 text-zinc-600" />Owner: {profile.owner}</span>
                    )}
                  </div>

                  {/* Rating + Banking + Custodian */}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {p.internalRating && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= p.internalRating ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"}`} />)}
                      </span>
                    )}
                    {p.bankingPartner && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800/50">
                        <Landmark className="h-3 w-3 text-zinc-600" />Banking: {p.bankingPartner}
                      </span>
                    )}
                    {p.custodian && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800/50">
                        <Shield className="h-3 w-3 text-zinc-600" />Custodian: {p.custodian}
                      </span>
                    )}
                  </div>

                  {/* Health indicator */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className={`h-2 w-2 rounded-full ${healthColor} ring-2 ring-black`} />
                      <span className={healthTextColor}>{healthLabel}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <Users className="h-4 w-4" />, label: "People", value: profile.people?.length || 0, accent: "yellow" },
              { icon: <Clock className="h-4 w-4" />, label: "Interactions", value: profile.interactions?.length || 0, accent: "blue" },
              { icon: <CheckSquare className="h-4 w-4" />, label: "Tasks", value: profile.tasks?.length || 0, accent: "purple" },
              { icon: <Calendar className="h-4 w-4" />, label: "Last Activity", value: lastActivity ? timeAgo(lastActivity) : "—", accent: "emerald", isText: true },
            ].map((s, i) => {
              const accentMap: Record<string, string> = {
                yellow: "text-yellow-500 bg-yellow-500/10", blue: "text-blue-500 bg-blue-500/10",
                red: "text-red-500 bg-red-500/10", emerald: "text-emerald-500 bg-emerald-500/10",
                purple: "text-purple-500 bg-purple-500/10",
              };
              const [tc, bg] = (accentMap[s.accent] || accentMap.yellow).split(" ");
              return (
                <div key={i} className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/50 transition-colors">
                  <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center ${tc} mb-3`}>{s.icon}</div>
                  <p className={`${(s as any).isText ? "text-lg" : "text-2xl"} font-bold text-white tabular-nums tracking-tight`}>{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* AI Intelligence Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl mb-8 overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <button onClick={() => setShowIntel(!showIntel)} className="flex items-center gap-2.5 text-sm font-semibold text-white hover:opacity-80 transition-opacity">
                <div className="h-7 w-7 rounded-lg bg-yellow-600/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                AI Company Intelligence
                {showIntel ? <ChevronUp className="h-4 w-4 text-zinc-600 ml-1" /> : <ChevronDown className="h-4 w-4 text-zinc-600 ml-1" />}
              </button>
              <Button variant="outline" size="sm"
                onClick={() => refreshAiMutation.mutate({ id: companyId })}
                disabled={refreshAiMutation.isPending}
                className="border-zinc-800 text-zinc-400 hover:text-yellow-500 hover:border-yellow-600/30 bg-transparent h-8 text-xs">
                {refreshAiMutation.isPending ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Generating</> : <><Sparkles className="h-3 w-3 mr-1.5" />{profile.aiMemory ? "Regenerate" : "Generate"}</>}
              </Button>
            </div>
            {showIntel && (
              <div className="px-5 pb-5 border-t border-zinc-800/50">
                {profile.aiMemory ? (
                  <div className="prose prose-invert prose-sm max-w-none mt-4">
                    <Streamdown>{profile.aiMemory}</Streamdown>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 italic mt-4">No AI memory yet. Click "Generate" to create an executive-level company intelligence summary.</p>
                )}
              </div>
            )}
          </div>

          {/* ═══════ TABBED CONTENT ═══════ */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-zinc-900/60 border border-zinc-800/50 p-1 rounded-xl mb-6 h-auto">
              {[
                { value: "overview", label: "Overview" },
                { value: "people", label: `People (${profile.people?.length || 0})` },
                { value: "timeline", label: `Timeline (${profile.interactions?.length || 0})` },
                { value: "tasks", label: `Tasks (${profile.tasks?.length || 0})` },
                { value: "documents", label: "Documents" },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="data-[state=active]:bg-yellow-600/15 data-[state=active]:text-yellow-500 data-[state=active]:shadow-none text-zinc-500 rounded-lg px-4 py-2 text-sm font-medium transition-all">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── OVERVIEW TAB ── */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Details */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-yellow-600" />Company Details
                    </h3>
                  </div>
                  <div className="px-5 pb-5 space-y-1">
                    {[
                      { label: "Domain", value: profile.domain },
                      { label: "Industry", value: profile.industry },
                      { label: "Status", value: profile.status },
                      { label: "Owner", value: profile.owner },
                      { label: "Location", value: p.location },
                      { label: "Entity Type", value: p.entityType ? ENTITY_LABELS[p.entityType] : null },
                      { label: "Banking Partner", value: p.bankingPartner },
                      { label: "Custodian", value: p.custodian },
                    ].filter(f => f.value).map(field => (
                      <div key={field.label} className="flex justify-between items-center py-2.5 border-b border-zinc-800/30 last:border-0">
                        <span className="text-xs text-zinc-500 font-medium">{field.label}</span>
                        <span className="text-sm text-white">{field.value}</span>
                      </div>
                    ))}
                    {p.regulatoryExposure && (
                      <div className="pt-3">
                        <span className="text-xs text-zinc-500 font-medium">Regulatory Exposure</span>
                        <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">{p.regulatoryExposure}</p>
                      </div>
                    )}
                    {profile.notes && (
                      <div className="pt-3">
                        <span className="text-xs text-zinc-500 font-medium">Notes</span>
                        <p className="text-sm text-zinc-300 mt-1.5 whitespace-pre-wrap leading-relaxed">{profile.notes}</p>
                      </div>
                    )}
                    {![profile.domain, profile.industry, profile.owner, p.location, p.entityType, p.bankingPartner, p.custodian, p.regulatoryExposure, profile.notes].some(Boolean) && (
                      <div className="py-8 text-center">
                        <Building2 className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">No details added yet. Click Edit to add company information.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key People Preview */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-600" />Key People
                    </h3>
                    {(profile.people?.length || 0) > 5 && (
                      <button onClick={() => setActiveTab("people")} className="text-xs text-zinc-500 hover:text-yellow-500 transition-colors">View all</button>
                    )}
                  </div>
                  <div className="px-5 pb-5 space-y-2">
                    {(!profile.people || profile.people.length === 0) ? (
                      <div className="py-8 text-center">
                        <Users className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">No people linked yet</p>
                      </div>
                    ) : (
                      profile.people.slice(0, 5).map((person: any) => (
                        <Link key={person.id} href={`/contact/${person.id}`}>
                          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-zinc-800/30 border border-zinc-800/50 hover:border-yellow-600/20 hover:bg-zinc-800/50 transition-all cursor-pointer group">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getInitialColor(person.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {getInitials(person.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{person.name}</p>
                              <p className="text-xs text-zinc-600 truncate">{person.title || person.email || "No title"}</p>
                            </div>
                            {person.category && person.category !== "other" && (
                              <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">{person.category}</Badge>
                            )}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />Recent Activity
                    </h3>
                    {(profile.interactions?.length || 0) > 5 && (
                      <button onClick={() => setActiveTab("timeline")} className="text-xs text-zinc-500 hover:text-yellow-500 transition-colors">View all</button>
                    )}
                  </div>
                  <div className="px-5 pb-5 space-y-2">
                    {(!profile.interactions || profile.interactions.length === 0) ? (
                      <div className="py-8 text-center">
                        <Clock className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">No interactions recorded</p>
                      </div>
                    ) : (
                      profile.interactions.slice(0, 5).map((interaction: any, idx: number) => {
                        const Icon = interactionIcons[interaction.type] || MessageSquare;
                        return (
                          <div key={interaction.id || idx} className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
                            <div className="h-8 w-8 rounded-md bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">{interaction.type}</Badge>
                                <span className="text-xs text-zinc-600">{timeAgo(interaction.timestamp)}</span>
                              </div>
                              <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{interaction.summary || "No summary"}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Tasks Preview */}
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-yellow-600" />Open Tasks
                    </h3>
                    {(profile.tasks?.length || 0) > 0 && (
                      <button onClick={() => setActiveTab("tasks")} className="text-xs text-zinc-500 hover:text-yellow-500 transition-colors">View all</button>
                    )}
                  </div>
                  <div className="px-5 pb-5 space-y-2">
                    {(!profile.tasks || profile.tasks.length === 0) ? (
                      <div className="py-8 text-center">
                        <CheckSquare className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">No tasks linked</p>
                      </div>
                    ) : (
                      profile.tasks.filter((t: any) => t.status !== "done" && t.status !== "completed").slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex items-center gap-3 p-3.5 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${task.status === "in_progress" ? "bg-yellow-500" : "bg-zinc-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{task.title}</p>
                            {task.assignedName && <p className="text-xs text-zinc-500">{task.assignedName}</p>}
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${
                            task.priority === "high" ? "border-red-500/20 text-red-400" :
                            task.priority === "medium" ? "border-yellow-500/20 text-yellow-400" :
                            "border-zinc-800 text-zinc-500"
                          }`}>{task.priority}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Private Notes */}
              {profile.notes && !editing && (
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-5 mt-6">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-yellow-600" />Private Notes
                  </h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{profile.notes}</p>
                </div>
              )}
            </TabsContent>

            {/* ── PEOPLE TAB ── */}
            <TabsContent value="people">
              <div className="space-y-4">
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-5">
                  <div className="text-xs text-zinc-500 mb-2 font-medium">Link a contact to this company</div>
                  <ContactAutocomplete
                    value={linkSearch}
                    onChange={setLinkSearch}
                    onSelect={(contact) => {
                      updateContactMutation.mutate({ id: contact.id, companyId });
                    }}
                    placeholder="Search contacts to link..."
                  />
                </div>

                {(!profile.people || profile.people.length === 0) ? (
                  <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-12 text-center">
                    <Users className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                    <p className="text-sm text-zinc-600">No people linked to this company yet.</p>
                    <p className="text-xs text-zinc-700 mt-1">Use the search above to link contacts.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.people.map((person: any) => (
                      <Link key={person.id} href={`/contact/${person.id}`}>
                        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4 hover:border-yellow-600/20 hover:bg-zinc-800/30 transition-all cursor-pointer group h-full">
                          <div className="flex items-start gap-3">
                            <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getInitialColor(person.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                              {getInitials(person.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">{person.name}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{person.title || "No title"}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {person.email && <span className="text-xs text-zinc-500 flex items-center gap-1"><Mail className="h-3 w-3" />{person.email}</span>}
                                {person.category && person.category !== "other" && (
                                  <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">{person.category}</Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 mt-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── TIMELINE TAB ── */}
            <TabsContent value="timeline">
              {(!profile.interactions || profile.interactions.length === 0) ? (
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-12 text-center">
                  <Clock className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">No interactions recorded yet.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-800/50" />
                  <div className="space-y-3">
                    {profile.interactions.map((interaction: any, idx: number) => {
                      const Icon = interactionIcons[interaction.type] || MessageSquare;
                      return (
                        <div key={interaction.id || idx} className="relative pl-12">
                          <div className="absolute left-3 top-4 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
                            <Icon className="h-2.5 w-2.5 text-yellow-600" />
                          </div>
                          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/50 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">{interaction.type}</Badge>
                              <span className="text-xs text-zinc-600">{interaction.timestamp ? formatDate(interaction.timestamp) : "—"} · {timeAgo(interaction.timestamp)}</span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{interaction.summary || "No summary"}</p>
                            {interaction.details && <p className="text-xs text-zinc-500 mt-2">{interaction.details}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── TASKS TAB ── */}
            <TabsContent value="tasks">
              {(!profile.tasks || profile.tasks.length === 0) ? (
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-12 text-center">
                  <CheckSquare className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">No tasks linked to this company.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.tasks.map((task: any) => {
                    const isCompleted = task.status === "done" || task.status === "completed";
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
                    return (
                      <div key={task.id} className={`p-4 rounded-xl border transition-all ${isCompleted ? "bg-zinc-800/20 border-zinc-800/30 opacity-70" : "bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/50"}`}>
                        <div className="flex items-start gap-3">
                          <CheckSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isCompleted ? "text-emerald-500" : "text-zinc-600"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isCompleted ? "text-zinc-500 line-through" : "text-white"}`}>{task.title}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {task.assignedName && <span className="text-xs text-zinc-500">{task.assignedName}</span>}
                              <Badge variant="outline" className={`text-[10px] ${
                                task.priority === "high" ? "border-red-500/20 text-red-400" :
                                task.priority === "medium" ? "border-yellow-500/20 text-yellow-400" :
                                "border-zinc-800 text-zinc-500"
                              }`}>{task.priority}</Badge>
                              {task.dueDate && (
                                <span className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-zinc-500"}`}>
                                  {isOverdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── DOCUMENTS TAB ── */}
            <TabsContent value="documents">
              <CompanyDocumentsTab companyId={companyId} companyName={profile.name} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ── Company Documents Tab ── */
function CompanyDocumentsTab({ companyId, companyName }: { companyId: number; companyName: string }) {
  const docs = trpc.vault.listDocuments.useQuery({ entityType: "company", entityId: companyId });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-yellow-600" /> Documents
        </h3>
        <Link href="/vault">
          <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-yellow-500 hover:border-yellow-600/30 bg-transparent text-xs">
            Open Vault
          </Button>
        </Link>
      </div>

      {docs.isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-14 bg-zinc-800/50 rounded-lg" />)}
        </div>
      ) : !docs.data?.length ? (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-12 text-center">
          <FileText className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
          <p className="text-sm text-zinc-600">No documents linked to {companyName}</p>
          <p className="text-xs text-zinc-700 mt-1">Upload documents in the Vault and tag them to this company</p>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl overflow-hidden">
          <div className="divide-y divide-zinc-800/30">
            {docs.data.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-800/20 transition-all group">
                <div className="h-9 w-9 rounded-lg bg-yellow-600/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.category && <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">{doc.category}</Badge>}
                    <span className="text-[10px] text-zinc-600">
                      {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
                {doc.fileUrl && (
                  <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, "_blank")} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-yellow-500 h-8 w-8 p-0">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
