import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, User, Calendar, CheckSquare, Building2, Mail, Phone,
  Clock, FileText, TrendingUp, AlertTriangle, Briefcase
} from "lucide-react";
import { Link, useParams } from "wouter";

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

  const { data: profile, isLoading } = trpc.contacts.getProfile.useQuery(
    { id: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

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
        <Link href="/meetings">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
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
      <Link href="/meetings">
        <Button variant="ghost" className="text-zinc-400 hover:text-white mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

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
              <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                {profile.organization && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-yellow-600" />
                    {profile.organization}
                  </span>
                )}
                {profile.title && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-yellow-600" />
                    {profile.title}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-yellow-600" />
                    {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-yellow-600" />
                    {profile.phone}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-2 font-medium ${statusColor}`}>
                {statusLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Total Meetings"
          value={profile.meetingCount}
          color="yellow"
        />
        <StatCard
          icon={<CheckSquare className="h-4 w-4" />}
          label="Total Tasks"
          value={profile.taskCount}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Open Tasks"
          value={profile.openTaskCount}
          color={profile.openTaskCount > 0 ? "red" : "emerald"}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Days Since Contact"
          value={daysSince ?? "—"}
          color={daysSince !== null && daysSince > 14 ? "red" : daysSince !== null && daysSince > 7 ? "yellow" : "emerald"}
        />
      </div>

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
          <CardContent className="space-y-2">
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
          <CardContent className="space-y-2">
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
      {profile.notes && (
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
