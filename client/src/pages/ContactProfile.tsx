import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, User, Calendar, CheckSquare, Building2, Mail, Phone,
  Clock, FileText, AlertTriangle, Briefcase, Edit3, Save, X,
  Globe, Linkedin, MapPin, Cake, Sparkles, Loader2, Trash2
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

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
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.contacts.getProfile.useQuery(
    { id: Number(id) },
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
    });
    setEditing(true);
  };

  const handleSave = () => {
    const updates: any = { id: Number(id) };
    for (const [key, value] of Object.entries(editData)) {
      updates[key] = (value as string).trim() || null;
    }
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-zinc-800/50" />
        <Skeleton className="h-40 bg-zinc-800/50 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 bg-zinc-800/50 rounded-xl" />
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/contacts">
          <Button variant="ghost" className="text-zinc-400 hover:text-white -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Contacts
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-zinc-400">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
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

      {/* Profile Header */}
      <Card className="bg-zinc-900/80 border-zinc-800 mb-6 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600" />
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-xl bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-yellow-500">
                {profile.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="MM/DD/YYYY" />
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
                  <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
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
                  {/* Additional info row */}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Calendar className="h-4 w-4" />} label="Total Meetings" value={profile.meetingCount} color="yellow" />
        <StatCard icon={<CheckSquare className="h-4 w-4" />} label="Total Tasks" value={profile.taskCount} color="blue" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Open Tasks" value={profile.openTaskCount} color={profile.openTaskCount > 0 ? "red" : "emerald"} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Days Since Contact" value={daysSince ?? "—"} color={daysSince !== null && daysSince > 14 ? "red" : daysSince !== null && daysSince > 7 ? "yellow" : "emerald"} />
      </div>

      {/* AI Summary */}
      <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-600" />
              AI Relationship Summary
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
              No AI summary yet. Click "Generate" to create an intelligence summary based on all meetings with this contact.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting History */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              Meeting History
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 ml-auto">
                {profile.meetingCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {profile.meetings.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No meetings recorded</p>
            ) : (
              profile.meetings.map((mc: any) => {
                const m = mc.meeting;
                return (
                  <Link key={m.id} href={`/meeting/${m.id}`}>
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
                    isCompleted
                      ? "bg-zinc-800/20 border-zinc-800/40 opacity-70"
                      : "bg-zinc-800/40 border-zinc-800"
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
                        {task.description && (
                          <p className="text-xs text-zinc-600 line-clamp-2 mt-0.5">{task.description}</p>
                        )}
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
      </div>

      {/* Notes */}
      {profile.notes && !editing && (
        <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-yellow-600" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{profile.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    red: "text-red-400 bg-red-500/10",
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
