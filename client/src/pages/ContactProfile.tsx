import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, User, Calendar, CheckSquare, Building2, Mail, Phone,
  Clock, FileText, AlertTriangle, Briefcase, Edit3, Save, X,
  Globe, Linkedin, MapPin, Cake, Sparkles, Loader2, Trash2,
  Star, MessageCircle, Send, Plus, Upload, Download, File,
  Brain, Link2, Users, Zap, Shield
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState, useRef } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const CATEGORY_COLORS: Record<string, string> = {
  client: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  prospect: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  partner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  vendor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const DOC_CATEGORY_LABELS: Record<string, string> = {
  ncnda: "NCNDA",
  contract: "Contract",
  agreement: "Agreement",
  proposal: "Proposal",
  invoice: "Invoice",
  kyc: "KYC",
  compliance: "Compliance",
  correspondence: "Correspondence",
  other: "Other",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatRelative(d: string | Date) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("other");
  const [docNotes, setDocNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.contacts.getProfile.useQuery(
    { id: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

  const { data: notes = [] } = trpc.contacts.getNotes.useQuery(
    { contactId: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

  const { data: documents = [] } = trpc.contacts.getDocuments.useQuery(
    { contactId: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

  const { data: linkedEmployee } = trpc.contacts.getLinkedEmployee.useQuery(
    { contactId: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated");
      utils.contacts.getProfile.invalidate({ id: Number(id) });
      setEditing(false);
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted");
      navigate("/contacts");
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  const aiSummaryMutation = trpc.contacts.generateAiSummary.useMutation({
    onSuccess: () => {
      toast.success("AI summary generated");
      utils.contacts.getProfile.invalidate({ id: Number(id) });
    },
    onError: () => toast.error("Failed to generate AI summary"),
  });

  const enrichMutation = trpc.contacts.enrichWithAI.useMutation({
    onSuccess: (data) => {
      const count = data.updated.length;
      if (count > 0) {
        toast.success(`AI enriched ${count} field${count > 1 ? "s" : ""}: ${data.updated.join(", ")}`);
      } else {
        toast.info("AI couldn't find new information to add. Try adding more meeting data.");
      }
      utils.contacts.getProfile.invalidate({ id: Number(id) });
    },
    onError: () => toast.error("Failed to enrich contact with AI"),
  });

  const toggleStarMutation = trpc.contacts.toggleStar.useMutation({
    onSuccess: () => {
      utils.contacts.getProfile.invalidate({ id: Number(id) });
      utils.contacts.list.invalidate();
    },
  });

  const addNoteMutation = trpc.contacts.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      utils.contacts.getNotes.invalidate({ contactId: Number(id) });
      setNewNote("");
    },
    onError: () => toast.error("Failed to add note"),
  });

  const deleteNoteMutation = trpc.contacts.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      utils.contacts.getNotes.invalidate({ contactId: Number(id) });
    },
  });

  const uploadDocMutation = trpc.contacts.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded");
      utils.contacts.getDocuments.invalidate({ contactId: Number(id) });
      setDocTitle("");
      setDocCategory("other");
      setDocNotes("");
      setUploading(false);
    },
    onError: () => {
      toast.error("Failed to upload document");
      setUploading(false);
    },
  });

  const deleteDocMutation = trpc.contacts.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      utils.contacts.getDocuments.invalidate({ contactId: Number(id) });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadDocMutation.mutate({
        contactId: Number(id),
        title: docTitle || file.name,
        category: docCategory as any,
        fileData: base64,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        notes: docNotes || undefined,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEditing = () => {
    if (!profile) return;
    setEditData({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      organization: profile.organization || "",
      title: profile.title || "",
      dateOfBirth: profile.dateOfBirth || "",
      address: profile.address || "",
      website: profile.website || "",
      linkedin: profile.linkedin || "",
      notes: profile.notes || "",
      category: profile.category || "other",
    });
    setEditing(true);
  };

  const handleSave = () => {
    const updates: any = { id: Number(id) };
    for (const [key, value] of Object.entries(editData)) {
      if (key === "category") {
        updates[key] = value;
      } else {
        updates[key] = (value as string).trim() || null;
      }
    }
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-zinc-800/50" />
        <Skeleton className="h-48 bg-zinc-800/50 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <User className="h-16 w-16 text-zinc-700 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Contact not found</h2>
        <p className="text-zinc-400 mb-6">This contact may have been removed or the ID is invalid.</p>
        <Link href="/contacts">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </Link>
      </div>
    );
  }

  const daysSince = profile.daysSinceLastMeeting;
  const statusColor = daysSince === null ? "text-zinc-500" :
    daysSince > 14 ? "text-red-400" :
    daysSince > 7 ? "text-yellow-500" : "text-emerald-400";
  const statusLabel = daysSince === null ? "No meetings" :
    daysSince === 0 ? "Spoke today" :
    daysSince === 1 ? "Spoke yesterday" :
    `${daysSince} days since last contact`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/contacts">
          <Button variant="ghost" className="text-zinc-400 hover:text-white -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Contacts
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => enrichMutation.mutate({ id: Number(id) })}
            disabled={enrichMutation.isPending}
            className="border-yellow-600/30 text-yellow-500 hover:bg-yellow-600/10 hover:text-yellow-400"
          >
            {enrichMutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Enriching...</>
            ) : (
              <><Brain className="h-3.5 w-3.5 mr-1.5" />AI Enrich</>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStarMutation.mutate({ id: Number(id) })}
            className="text-zinc-400 hover:text-yellow-500"
          >
            <Star className={`h-4 w-4 ${profile.starred ? "text-yellow-500 fill-yellow-500" : ""}`} />
          </Button>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-zinc-400">
                <X className="h-3.5 w-3.5 mr-1.5" />Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete Contact</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Are you sure you want to delete {profile.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate({ id: Number(id) })}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-zinc-900/80 border-zinc-800 mb-6 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600" />
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="h-18 w-18 rounded-xl bg-yellow-600/20 flex items-center justify-center flex-shrink-0 relative" style={{ height: 72, width: 72 }}>
              <span className="text-2xl font-bold text-yellow-500">
                {profile.name?.charAt(0)?.toUpperCase()}
              </span>
              {profile.starred && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 absolute -top-1 -right-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-zinc-500 text-xs">Full Name</Label>
                      <Input value={editData.name} onChange={(e) => setEditData((p: any) => ({ ...p, name: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-zinc-500 text-xs">Job Title</Label>
                      <Input value={editData.title} onChange={(e) => setEditData((p: any) => ({ ...p, title: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="e.g. Managing Director" />
                    </div>
                    <div>
                      <Label className="text-zinc-500 text-xs">Category</Label>
                      <Select value={editData.category || "other"} onValueChange={(v) => setEditData((p: any) => ({ ...p, category: v }))}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-500 text-xs">Organization</Label>
                      <Input value={editData.organization} onChange={(e) => setEditData((p: any) => ({ ...p, organization: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Company name" />
                    </div>
                    <div>
                      <Label className="text-zinc-500 text-xs">Email</Label>
                      <Input value={editData.email} onChange={(e) => setEditData((p: any) => ({ ...p, email: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="email@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-500 text-xs">Phone</Label>
                      <Input value={editData.phone} onChange={(e) => setEditData((p: any) => ({ ...p, phone: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div>
                      <Label className="text-zinc-500 text-xs">Date of Birth</Label>
                      <Input value={editData.dateOfBirth} onChange={(e) => setEditData((p: any) => ({ ...p, dateOfBirth: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="YYYY-MM-DD" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Address</Label>
                    <Input value={editData.address} onChange={(e) => setEditData((p: any) => ({ ...p, address: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Full address" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-500 text-xs">Website</Label>
                      <Input value={editData.website} onChange={(e) => setEditData((p: any) => ({ ...p, website: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="https://example.com" />
                    </div>
                    <div>
                      <Label className="text-zinc-500 text-xs">LinkedIn</Label>
                      <Input value={editData.linkedin} onChange={(e) => setEditData((p: any) => ({ ...p, linkedin: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Notes</Label>
                    <Textarea value={editData.notes} onChange={(e) => setEditData((p: any) => ({ ...p, notes: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[80px]" placeholder="Private notes about this contact..." />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                    {profile.category && profile.category !== "other" && (
                      <Badge variant="outline" className={CATEGORY_COLORS[profile.category] || ""}>
                        {profile.category}
                      </Badge>
                    )}
                    {linkedEmployee && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        <Users className="h-3 w-3 mr-1" />
                        Employee
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                    {profile.title && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-yellow-600" />
                        {profile.title}
                      </span>
                    )}
                    {profile.organization && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-yellow-600" />
                        {profile.organization}
                      </span>
                    )}
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                        <Mail className="h-3.5 w-3.5 text-yellow-600" />
                        {profile.email}
                      </a>
                    )}
                    {profile.phone && (
                      <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                        <Phone className="h-3.5 w-3.5 text-yellow-600" />
                        {profile.phone}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 mt-1">
                    {profile.dateOfBirth && (
                      <span className="flex items-center gap-1.5">
                        <Cake className="h-3.5 w-3.5 text-zinc-600" />
                        {profile.dateOfBirth}
                      </span>
                    )}
                    {profile.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                        {profile.address}
                      </span>
                    )}
                    {profile.website && (
                      <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                        <Globe className="h-3.5 w-3.5 text-zinc-600" />
                        Website
                      </a>
                    )}
                    {profile.linkedin && (
                      <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                        <Linkedin className="h-3.5 w-3.5 text-zinc-600" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                  <p className={`text-sm mt-2 font-medium ${statusColor}`}>
                    {statusLabel}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard icon={<Calendar className="h-4 w-4" />} label="Meetings" value={profile.meetingCount} color="yellow" />
        <StatCard icon={<CheckSquare className="h-4 w-4" />} label="Tasks" value={profile.taskCount} color="blue" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Open Tasks" value={profile.openTaskCount} color={profile.openTaskCount > 0 ? "red" : "emerald"} />
        <StatCard icon={<FileText className="h-4 w-4" />} label="Documents" value={documents.length} color="purple" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Days Since Contact" value={daysSince ?? "—"} color={daysSince !== null && daysSince > 14 ? "red" : daysSince !== null && daysSince > 7 ? "yellow" : "emerald"} />
      </div>

      {/* AI Summary */}
      <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-600" />
              AI Relationship Intelligence
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => aiSummaryMutation.mutate({ id: Number(id) })}
              disabled={aiSummaryMutation.isPending}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-yellow-500"
            >
              {aiSummaryMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5" />{profile.aiSummary ? "Regenerate" : "Generate"}</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.aiSummary ? (
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{profile.aiSummary}</p>
          ) : (
            <p className="text-sm text-zinc-600 italic">
              No AI summary yet. Click "Generate" or "AI Enrich" to create an intelligence summary based on all meetings with this contact.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900/50 border border-zinc-800 mb-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
            Overview
          </TabsTrigger>
          <TabsTrigger value="meetings" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
            Meetings ({profile.meetingCount})
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
            Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Meetings */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  Recent Meetings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.meetings.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4 text-center">No meetings recorded</p>
                ) : (
                  profile.meetings.slice(0, 5).map((mc: any) => {
                    const m = mc.meeting;
                    return (
                      <Link key={`meeting-${m.id}`} href={`/meeting/${m.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 hover:border-yellow-600/30 transition-colors cursor-pointer group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-yellow-500 transition-colors truncate">
                              {m.meetingTitle || "Untitled Meeting"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {formatDate(m.meetingDate)} · {formatRelative(m.meetingDate)}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs ml-2 flex-shrink-0">
                            {m.sourceType}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                )}
                {profile.meetings.length > 5 && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("meetings")} className="w-full text-zinc-400 hover:text-yellow-500 mt-2">
                    View all {profile.meetingCount} meetings
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-yellow-600" />
                  Assigned Tasks
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 ml-auto">
                    {profile.taskCount}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {profile.tasks.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4 text-center">No tasks assigned</p>
                ) : (
                  profile.tasks.map((task: any) => {
                    const isCompleted = task.status === "completed";
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
                    return (
                      <div key={task.id} className={`p-3 rounded-lg border transition-all ${
                        isCompleted ? "bg-zinc-800/20 border-zinc-800/40 opacity-70" : "bg-zinc-800/40 border-zinc-800"
                      }`}>
                        <div className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                            isCompleted ? "bg-emerald-500" :
                            task.status === "in_progress" ? "bg-yellow-500" : "bg-zinc-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isCompleted ? "text-zinc-500 line-through" : "text-white"}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Badge variant="outline" className={`text-xs ${
                                task.priority === "high" ? "border-red-500/30 text-red-400" :
                                task.priority === "medium" ? "border-yellow-500/30 text-yellow-400" :
                                "border-blue-500/30 text-blue-400"
                              }`}>
                                {task.priority}
                              </Badge>
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
              </CardContent>
            </Card>

            {/* Recent Documents */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    Recent Documents
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("documents")} className="text-zinc-400 hover:text-yellow-500">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4 text-center">No documents uploaded</p>
                ) : (
                  documents.slice(0, 4).map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                      <div className="h-8 w-8 rounded-md bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                        <File className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                        <p className="text-xs text-zinc-500">{DOC_CATEGORY_LABELS[doc.category] || doc.category} · {formatRelative(doc.createdAt)}</p>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-yellow-500 h-7 w-7 p-0">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Notes */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-yellow-600" />
                  Recent Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a quick note..."
                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newNote.trim()) {
                        addNoteMutation.mutate({ contactId: Number(id), content: newNote.trim() });
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newNote.trim()) addNoteMutation.mutate({ contactId: Number(id), content: newNote.trim() });
                    }}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-2 text-center">No notes yet</p>
                  ) : (
                    notes.slice(0, 4).map((note: any) => (
                      <div key={note.id} className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 group">
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap line-clamp-2">{note.content}</p>
                        <span className="text-xs text-zinc-600 mt-1 block">
                          {note.createdByName} · {formatRelative(note.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {notes.length > 4 && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("notes")} className="w-full text-zinc-400 hover:text-yellow-500 mt-2">
                    View all {notes.length} notes
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Private Notes */}
          {profile.notes && !editing && (
            <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  Private Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{profile.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Employee Link */}
          {linkedEmployee && (
            <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-400" />
                  Linked Employee Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/hr/employee/${linkedEmployee.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/40 border border-zinc-800 hover:border-blue-500/30 transition-colors cursor-pointer">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{linkedEmployee.firstName} {linkedEmployee.lastName}</p>
                      <p className="text-xs text-zinc-400">{linkedEmployee.jobTitle} · {linkedEmployee.department || "No department"}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Hired {linkedEmployee.hireDate}</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-600" />
                All Meetings
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 ml-auto">
                  {profile.meetingCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.meetings.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 text-center">No meetings recorded with this contact</p>
              ) : (
                profile.meetings.map((mc: any) => {
                  const m = mc.meeting;
                  return (
                    <Link key={`all-meeting-${m.id}`} href={`/meeting/${m.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/40 border border-zinc-800 hover:border-yellow-600/30 transition-colors cursor-pointer group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-yellow-500 transition-colors">
                            {m.meetingTitle || "Untitled Meeting"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {formatDate(m.meetingDate)} · {formatRelative(m.meetingDate)}
                          </p>
                          {m.executiveSummary && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{m.executiveSummary}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs ml-4 flex-shrink-0">
                          {m.sourceType}
                        </Badge>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-yellow-600" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <Label className="text-zinc-500 text-xs">Document Title</Label>
                  <Input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. NCNDA - OmniScope"
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-zinc-500 text-xs">Category</Label>
                  <Select value={docCategory} onValueChange={setDocCategory}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="ncnda">NCNDA</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="agreement">Agreement</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="kyc">KYC</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="correspondence">Correspondence</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-500 text-xs">Notes (optional)</Label>
                  <Input
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="Quick note about this document"
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Choose File & Upload</>
                )}
              </Button>
              <p className="text-xs text-zinc-600 mt-2">Max 10MB. Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT, CSV</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-600" />
                All Documents
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 ml-auto">
                  {documents.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 text-center">No documents uploaded yet. Use the form above to upload NCNDAs, contracts, and other files.</p>
              ) : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800/40 border border-zinc-800 group">
                    <div className="h-10 w-10 rounded-lg bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                      <File className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                          {DOC_CATEGORY_LABELS[doc.category] || doc.category}
                        </Badge>
                        <span className="text-xs text-zinc-500">{formatRelative(doc.createdAt)}</span>
                      </div>
                      {doc.notes && <p className="text-xs text-zinc-500 mt-1">{doc.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-yellow-500 h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              Delete "{doc.title}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteDocMutation.mutate({ id: doc.id })}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-yellow-600" />
                Contact Notes
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 ml-auto">
                  {notes.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a detailed note about this contact..."
                  className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[80px]"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (newNote.trim()) addNoteMutation.mutate({ contactId: Number(id), content: newNote.trim() });
                }}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium mb-4"
              >
                <Send className="h-4 w-4 mr-2" />
                Add Note
              </Button>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-8 text-center">No notes yet. Add your first note above.</p>
                ) : (
                  notes.map((note: any) => (
                    <div key={note.id} className="p-4 rounded-lg bg-zinc-800/40 border border-zinc-800 group">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
                        <span className="text-xs text-zinc-600">
                          {note.createdByName} · {formatDate(note.createdAt)} ({formatRelative(note.createdAt)})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNoteMutation.mutate({ id: note.id })}
                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    red: "text-red-400 bg-red-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    zinc: "text-zinc-400 bg-zinc-500/10",
  };
  const [iconColor, iconBg] = (colorMap[color] || colorMap.zinc).split(" ");

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-4">
        <div className={`h-8 w-8 rounded-md ${iconBg} flex items-center justify-center ${iconColor} mb-2`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
