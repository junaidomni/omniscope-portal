import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  Building2, Users, Calendar, Sparkles, ChevronLeft, Globe,
  Edit2, Save, X, Briefcase, MessageSquare, Clock, FileText,
  TrendingUp, Loader2, RefreshCw, CheckSquare, Trash2, MapPin,
  Shield, Star, Target, ChevronRight, Mail, Phone, AlertTriangle,
  Landmark, Eye, UserCheck, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Streamdown } from "streamdown";
import { ContactAutocomplete } from "@/components/ContactAutocomplete";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarColor(name: string) {
  const colors = [
    "from-yellow-600 to-amber-700", "from-emerald-600 to-green-700",
    "from-blue-600 to-indigo-700", "from-purple-600 to-violet-700",
    "from-rose-600 to-pink-700", "from-cyan-600 to-teal-700",
  ];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
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

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  prospect: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};
const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};
const ENTITY_LABELS: Record<string, string> = {
  sovereign: "Sovereign", private: "Private", institutional: "Institutional",
  family_office: "Family Office", other: "Other",
};
const interactionIcons: Record<string, any> = {
  meeting: Calendar, note: MessageSquare, doc_shared: FileText,
  task_update: CheckSquare, email: Mail, call: Phone, intro: Users,
};

export default function CompanyProfile() {
  const [, params] = useRoute("/company/:id");
  const companyId = Number(params?.id);
  const [, navigate] = useLocation();
  const { data: profile, isLoading, refetch } = trpc.companies.getProfile.useQuery(
    { id: companyId }, { enabled: !!companyId }
  );
  const utils = trpc.useUtils();

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
  const [activeTab, setActiveTab] = useState<"overview" | "people" | "timeline" | "ai" | "tasks">("overview");
  const [linkSearch, setLinkSearch] = useState("");

  const updateContactMutation = trpc.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contact linked"); setLinkSearch(""); utils.companies.getProfile.invalidate({ id: companyId }); },
    onError: () => toast.error("Failed to link contact"),
  });

  if (isLoading || !profile) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 bg-zinc-800" />
        <Skeleton className="h-48 bg-zinc-800/50 rounded-xl" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-lg" />)}</div>
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

  const p = profile as any;
  const lastActivity = profile.interactions?.length > 0 ? profile.interactions[0]?.timestamp : null;

  const tabs = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "people", label: `People (${profile.people?.length || 0})`, icon: Users },
    { key: "timeline", label: `Timeline (${profile.interactions?.length || 0})`, icon: Clock },
    { key: "tasks", label: `Tasks (${profile.tasks?.length || 0})`, icon: CheckSquare },
    { key: "ai", label: "AI Memory", icon: Sparkles },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/companies">
          <Button variant="ghost" className="text-zinc-400 hover:text-white -ml-2">
            <ChevronLeft className="h-4 w-4 mr-2" /> Companies
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEdit} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-zinc-400"><X className="h-3.5 w-3.5 mr-1.5" />Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium">
                <Save className="h-3.5 w-3.5 mr-1.5" />{updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></Button>
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
        </div>
      </div>

      {/* ===== COMPANY HEADER ===== */}
      <Card className="bg-zinc-900/80 border-zinc-800 mb-6 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600" />
        <CardContent className="p-6">
          {editing ? (
            /* ===== EDIT MODE ===== */
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-2">Edit Company</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label className="text-zinc-500 text-xs">Company Name</Label>
                  <Input value={editData.name} onChange={e => setEditData((p: any) => ({ ...p, name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" /></div>
                <div><Label className="text-zinc-500 text-xs">Domain</Label>
                  <Input value={editData.domain} onChange={e => setEditData((p: any) => ({ ...p, domain: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="example.com" /></div>
                <div><Label className="text-zinc-500 text-xs">Industry</Label>
                  <Input value={editData.industry} onChange={e => setEditData((p: any) => ({ ...p, industry: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label className="text-zinc-500 text-xs">Status</Label>
                  <Select value={editData.status} onValueChange={v => setEditData((p: any) => ({ ...p, status: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="active">Active</SelectItem><SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label className="text-zinc-500 text-xs">Owner</Label>
                  <Input value={editData.owner} onChange={e => setEditData((p: any) => ({ ...p, owner: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" /></div>
                <div><Label className="text-zinc-500 text-xs">Location</Label>
                  <Input value={editData.location} onChange={e => setEditData((p: any) => ({ ...p, location: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Dubai, UAE" /></div>
              </div>

              {/* Strategic Intelligence */}
              <div className="border-t border-zinc-800 pt-4 mt-4">
                <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-3">Strategic Intelligence</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><Label className="text-zinc-500 text-xs">Entity Type</Label>
                    <Select value={editData.entityType || "none"} onValueChange={v => setEditData((p: any) => ({ ...p, entityType: v === "none" ? "" : v }))}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="none">Not Set</SelectItem><SelectItem value="sovereign">Sovereign</SelectItem>
                        <SelectItem value="private">Private</SelectItem><SelectItem value="institutional">Institutional</SelectItem>
                        <SelectItem value="family_office">Family Office</SelectItem><SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div><Label className="text-zinc-500 text-xs">Jurisdiction Risk</Label>
                    <Select value={editData.jurisdictionRisk || "none"} onValueChange={v => setEditData((p: any) => ({ ...p, jurisdictionRisk: v === "none" ? "" : v }))}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="none">Not Set</SelectItem><SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div><Label className="text-zinc-500 text-xs">Internal Rating (1-5)</Label>
                    <Input type="number" min={1} max={5} value={editData.internalRating} onChange={e => setEditData((p: any) => ({ ...p, internalRating: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="1-5" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-zinc-500 text-xs">Banking Partner</Label>
                    <Input value={editData.bankingPartner} onChange={e => setEditData((p: any) => ({ ...p, bankingPartner: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" /></div>
                  <div><Label className="text-zinc-500 text-xs">Custodian</Label>
                    <Input value={editData.custodian} onChange={e => setEditData((p: any) => ({ ...p, custodian: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" /></div>
                </div>
                <div className="mt-3"><Label className="text-zinc-500 text-xs">Regulatory Exposure</Label>
                  <Textarea value={editData.regulatoryExposure} onChange={e => setEditData((p: any) => ({ ...p, regulatoryExposure: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[60px]" placeholder="OFAC, sanctions, PEP exposure..." /></div>
              </div>

              <div><Label className="text-zinc-500 text-xs">Notes</Label>
                <Textarea value={editData.notes} onChange={e => setEditData((p: any) => ({ ...p, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[80px]" /></div>
            </div>
          ) : (
            /* ===== VIEW MODE ===== */
            <div className="flex items-start gap-5">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.name} className="w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className={`h-[72px] w-[72px] rounded-xl bg-gradient-to-br ${getAvatarColor(profile.name)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl font-bold text-white">{getInitials(profile.name)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <Badge variant="outline" className={STATUS_COLORS[profile.status] || ""}>{profile.status}</Badge>
                  {p.entityType && <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700"><Landmark className="h-3 w-3 mr-1" />{ENTITY_LABELS[p.entityType] || p.entityType}</Badge>}
                  {p.jurisdictionRisk && <Badge variant="outline" className={RISK_COLORS[p.jurisdictionRisk] || ""}><Shield className="h-3 w-3 mr-1" />{p.jurisdictionRisk} risk</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                  {profile.industry && <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-yellow-600" />{profile.industry}</span>}
                  {profile.domain && (
                    <a href={`https://${profile.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                      <Globe className="h-3.5 w-3.5 text-yellow-600" />{profile.domain}
                    </a>
                  )}
                  {p.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-yellow-600" />{p.location}</span>}
                  {profile.owner && <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-zinc-600" />Owner: {profile.owner}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {p.internalRating && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= p.internalRating ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"}`} />)}
                    </span>
                  )}
                  {p.bankingPartner && <span className="text-xs text-zinc-500 flex items-center gap-1"><Landmark className="h-3 w-3 text-zinc-600" />Banking: {p.bankingPartner}</span>}
                  {p.custodian && <span className="text-xs text-zinc-500 flex items-center gap-1"><Shield className="h-3 w-3 text-zinc-600" />Custodian: {p.custodian}</span>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== STATS GRID ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users className="h-4 w-4" />} label="People" value={profile.people?.length || 0} color="yellow" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Interactions" value={profile.interactions?.length || 0} color="blue" />
        <StatCard icon={<CheckSquare className="h-4 w-4" />} label="Tasks" value={profile.tasks?.length || 0} color="purple" />
        <StatCard icon={<Calendar className="h-4 w-4" />} label="Last Activity" value={lastActivity ? timeAgo(lastActivity) : "—"} color="emerald" isText />
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-1 border-b border-zinc-800 pb-0 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-yellow-600 text-yellow-500"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Details */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-yellow-600" />Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                <div key={field.label} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
                  <span className="text-xs text-zinc-500">{field.label}</span>
                  <span className="text-sm text-white">{field.value}</span>
                </div>
              ))}
              {p.regulatoryExposure && (
                <div className="pt-2">
                  <span className="text-xs text-zinc-500">Regulatory Exposure</span>
                  <p className="text-sm text-zinc-300 mt-1">{p.regulatoryExposure}</p>
                </div>
              )}
              {profile.notes && (
                <div className="pt-2">
                  <span className="text-xs text-zinc-500">Notes</span>
                  <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{profile.notes}</p>
                </div>
              )}
              {![profile.domain, profile.industry, profile.owner, p.location, p.entityType, p.bankingPartner, p.custodian, p.regulatoryExposure, profile.notes].some(Boolean) && (
                <p className="text-sm text-zinc-600 py-4 text-center">No details added yet. Click Edit to add company information.</p>
              )}
            </CardContent>
          </Card>

          {/* Key People Preview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-yellow-600" />Key People
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("people")} className="text-zinc-400 hover:text-yellow-500 text-xs">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!profile.people || profile.people.length === 0) ? (
                <p className="text-sm text-zinc-600 py-4 text-center">No people linked yet</p>
              ) : (
                profile.people.slice(0, 5).map((person: any) => (
                  <Link key={person.id} href={`/contact/${person.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 hover:border-yellow-600/30 transition-colors cursor-pointer group">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getAvatarColor(person.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {getInitials(person.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white group-hover:text-yellow-500 transition-colors truncate">{person.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{person.title || person.email || "No title"}</p>
                      </div>
                      {person.category && person.category !== "other" && (
                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{person.category}</Badge>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("timeline")} className="text-zinc-400 hover:text-yellow-500 text-xs">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!profile.interactions || profile.interactions.length === 0) ? (
                <p className="text-sm text-zinc-600 py-4 text-center">No interactions recorded</p>
              ) : (
                profile.interactions.slice(0, 5).map((interaction: any, idx: number) => {
                  const Icon = interactionIcons[interaction.type] || MessageSquare;
                  return (
                    <div key={interaction.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                      <div className="h-8 w-8 rounded-md bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{interaction.type}</Badge>
                          <span className="text-xs text-zinc-600">{timeAgo(interaction.timestamp)}</span>
                        </div>
                        <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{interaction.summary || "No summary"}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Tasks Preview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-yellow-600" />Open Tasks
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("tasks")} className="text-zinc-400 hover:text-yellow-500 text-xs">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!profile.tasks || profile.tasks.length === 0) ? (
                <p className="text-sm text-zinc-600 py-4 text-center">No tasks linked</p>
              ) : (
                profile.tasks.filter((t: any) => t.status !== "done" && t.status !== "completed").slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${task.status === "in_progress" ? "bg-yellow-500" : "bg-zinc-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{task.title}</p>
                      {task.assignedName && <p className="text-xs text-zinc-500">{task.assignedName}</p>}
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${
                      task.priority === "high" ? "border-red-500/30 text-red-400" :
                      task.priority === "medium" ? "border-yellow-500/30 text-yellow-400" :
                      "border-zinc-700 text-zinc-400"
                    }`}>{task.priority}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== PEOPLE TAB ===== */}
      {activeTab === "people" && (
        <div className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-xs text-zinc-500 mb-2 font-medium">Link a contact to this company</div>
              <ContactAutocomplete
                value={linkSearch}
                onChange={setLinkSearch}
                onSelect={(contact) => {
                  updateContactMutation.mutate({ id: contact.id, companyId });
                }}
                placeholder="Search contacts to link..."
              />
            </CardContent>
          </Card>

          {(!profile.people || profile.people.length === 0) ? (
            <div className="text-center py-12 text-zinc-600">No people linked to this company yet. Use the search above to link contacts.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.people.map((person: any) => (
                <Link key={person.id} href={`/contact/${person.id}`}>
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-yellow-600/30 transition-all cursor-pointer group h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getAvatarColor(person.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {getInitials(person.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">{person.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{person.title || "No title"}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {person.email && <span className="text-xs text-zinc-500 flex items-center gap-1"><Mail className="h-3 w-3" />{person.email}</span>}
                            {person.category && person.category !== "other" && (
                              <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{person.category}</Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TIMELINE TAB ===== */}
      {activeTab === "timeline" && (
        <div className="space-y-3">
          {(!profile.interactions || profile.interactions.length === 0) ? (
            <div className="text-center py-12 text-zinc-600">No interactions recorded yet.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-800" />
              {profile.interactions.map((interaction: any, idx: number) => {
                const Icon = interactionIcons[interaction.type] || MessageSquare;
                return (
                  <div key={interaction.id || idx} className="relative pl-12 pb-4">
                    <div className="absolute left-3 top-1 w-5 h-5 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                      <Icon className="h-2.5 w-2.5 text-yellow-600" />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{interaction.type}</Badge>
                        <span className="text-xs text-zinc-600">{interaction.timestamp ? formatDate(interaction.timestamp) : "—"} · {timeAgo(interaction.timestamp)}</span>
                      </div>
                      <p className="text-sm text-zinc-300">{interaction.summary || "No summary"}</p>
                      {interaction.details && <p className="text-xs text-zinc-500 mt-2">{interaction.details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TASKS TAB ===== */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {(!profile.tasks || profile.tasks.length === 0) ? (
            <div className="text-center py-12 text-zinc-600">No tasks linked to this company.</div>
          ) : (
            profile.tasks.map((task: any) => {
              const isCompleted = task.status === "done" || task.status === "completed";
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
              return (
                <div key={task.id} className={`p-4 rounded-lg border transition-all ${isCompleted ? "bg-zinc-800/20 border-zinc-800/40 opacity-70" : "bg-zinc-900/50 border-zinc-800"}`}>
                  <div className="flex items-start gap-3">
                    <CheckSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isCompleted ? "text-emerald-500" : "text-zinc-600"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isCompleted ? "text-zinc-500 line-through" : "text-white"}`}>{task.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {task.assignedName && <span className="text-xs text-zinc-500">{task.assignedName}</span>}
                        <Badge variant="outline" className={`text-[10px] ${
                          task.priority === "high" ? "border-red-500/30 text-red-400" :
                          task.priority === "medium" ? "border-yellow-500/30 text-yellow-400" :
                          "border-zinc-700 text-zinc-400"
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
            })
          )}
        </div>
      )}

      {/* ===== AI MEMORY TAB ===== */}
      {activeTab === "ai" && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-600" /> AI Company Memory
            </CardTitle>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-yellow-500"
              onClick={() => refreshAiMutation.mutate({ id: companyId })}
              disabled={refreshAiMutation.isPending}>
              {refreshAiMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><RefreshCw className="h-4 w-4 mr-2" />Generate Brief</>}
            </Button>
          </CardHeader>
          <CardContent>
            {profile.aiMemory ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <Streamdown>{profile.aiMemory}</Streamdown>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-600">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm">No AI Memory generated yet.</p>
                <p className="text-xs text-zinc-700 mt-1">Click "Generate Brief" to create an executive-level company intelligence summary.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, isText }: { icon: React.ReactNode; label: string; value: number | string; color: string; isText?: boolean }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10", yellow: "text-yellow-400 bg-yellow-500/10",
    blue: "text-blue-400 bg-blue-500/10", red: "text-red-400 bg-red-500/10",
    purple: "text-purple-400 bg-purple-500/10", zinc: "text-zinc-400 bg-zinc-500/10",
  };
  const [iconColor, iconBg] = (colorMap[color] || colorMap.zinc).split(" ");
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-4">
        <div className={`h-8 w-8 rounded-md ${iconBg} flex items-center justify-center ${iconColor} mb-2`}>{icon}</div>
        <p className={`${isText ? "text-lg" : "text-2xl"} font-bold text-white tabular-nums`}>{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
