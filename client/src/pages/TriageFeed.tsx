import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Mail,
  UserPlus,
  Building2,
  Calendar,
  ArrowRight,
  Flame,
  Loader2,
  ChevronRight,
  Zap,
} from "lucide-react";

// ─── Priority badge ────────────────────────────────────────────────────────
function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === "high"
      ? "bg-red-500"
      : priority === "medium"
      ? "bg-yellow-500"
      : "bg-zinc-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  count,
  color,
  linkTo,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  linkTo?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <span className="text-xs text-zinc-500 font-mono">{count}</span>
      {linkTo && (
        <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-yellow-500 transition-colors ml-auto" />
      )}
    </div>
  );
  return linkTo ? <Link href={linkTo}>{inner}</Link> : inner;
}

// ─── Task row ──────────────────────────────────────────────────────────────
function TaskRow({
  task,
  showOverdue,
}: {
  task: {
    id: number;
    title: string;
    priority: string;
    dueDate: any;
    assignedName: string | null;
    category: string | null;
    status: string;
  };
  showOverdue?: boolean;
}) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const now = new Date();
  const isOverdue = dueDate && dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysOverdue = dueDate
    ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Link href="/operations">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group">
        <PriorityDot priority={task.priority} />
        <span className="text-sm text-zinc-200 truncate flex-1 group-hover:text-white transition-colors">
          {task.title}
        </span>
        {task.assignedName && (
          <span className="text-xs text-zinc-500 shrink-0">{task.assignedName}</span>
        )}
        {task.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
            {task.category}
          </span>
        )}
        {showOverdue && isOverdue && daysOverdue > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/50 text-red-400 shrink-0">
            {daysOverdue}d overdue
          </span>
        )}
        {dueDate && !isOverdue && (
          <span className="text-[10px] text-zinc-500 shrink-0">
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Main Triage Feed ──────────────────────────────────────────────────────
export default function TriageFeed() {
  const { data, isLoading, error } = trpc.triage.feed.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Failed to load triage feed
      </div>
    );
  }

  const { summary } = data;
  const hasOverdue = data.overdueTasks.length > 0;
  const hasTodayTasks = data.todayTasks.length > 0;
  const hasHighPriority = data.highPriorityTasks.length > 0;
  const hasStarredEmails = data.starredEmails.length > 0;
  const hasPendingContacts = data.pendingContacts.length > 0;
  const hasPendingCompanies = data.pendingCompanies.length > 0;
  const hasRecentMeetings = data.recentMeetings.length > 0;
  const nothingToTriage =
    !hasOverdue && !hasTodayTasks && !hasHighPriority && !hasStarredEmails && !hasPendingContacts && !hasPendingCompanies;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Summary strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Open", value: summary.totalOpen, color: "text-zinc-300" },
          { label: "Overdue", value: summary.totalOverdue, color: summary.totalOverdue > 0 ? "text-red-400" : "text-zinc-500" },
          { label: "High Priority", value: summary.totalHighPriority, color: summary.totalHighPriority > 0 ? "text-yellow-400" : "text-zinc-500" },
          { label: "Done Today", value: summary.completedToday, color: summary.completedToday > 0 ? "text-emerald-400" : "text-zinc-500" },
          { label: "Starred Mail", value: summary.totalStarred, color: summary.totalStarred > 0 ? "text-yellow-400" : "text-zinc-500" },
          { label: "Pending", value: summary.totalPendingApprovals, color: summary.totalPendingApprovals > 0 ? "text-orange-400" : "text-zinc-500" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/40 rounded-xl px-4 py-3 text-center">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── All clear state ───────────────────────────────────────────── */}
      {nothingToTriage && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-emerald-950/30 border border-emerald-800/30 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">All Clear</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Nothing requires your immediate attention. Check back later or review
            the overview for a broader picture.
          </p>
        </div>
      )}

      {/* ── Overdue tasks ─────────────────────────────────────────────── */}
      {hasOverdue && (
        <div className="bg-red-950/10 border border-red-900/20 rounded-xl p-4 space-y-2">
          <SectionHeader
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            title="Overdue"
            count={data.overdueTasks.length}
            color="bg-red-950/40"
            linkTo="/operations"
          />
          <div className="space-y-0.5 mt-2">
            {data.overdueTasks.map((t) => (
              <TaskRow key={t.id} task={t} showOverdue />
            ))}
          </div>
        </div>
      )}

      {/* ── Due today ─────────────────────────────────────────────────── */}
      {hasTodayTasks && (
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 space-y-2">
          <SectionHeader
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
            title="Due Today"
            count={data.todayTasks.length}
            color="bg-yellow-950/40"
            linkTo="/operations"
          />
          <div className="space-y-0.5 mt-2">
            {data.todayTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── High priority ─────────────────────────────────────────────── */}
      {hasHighPriority && (
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 space-y-2">
          <SectionHeader
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            title="High Priority"
            count={data.highPriorityTasks.length}
            color="bg-orange-950/40"
            linkTo="/operations"
          />
          <div className="space-y-0.5 mt-2">
            {data.highPriorityTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Starred emails ────────────────────────────────────────────── */}
      {hasStarredEmails && (
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 space-y-2">
          <SectionHeader
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            title="Starred Emails"
            count={data.starredEmails.length}
            color="bg-yellow-950/40"
            linkTo="/communications"
          />
          <div className="space-y-0.5 mt-2">
            {data.starredEmails.map((s) => {
              const starLabels = { 1: "Reply Today", 2: "Delegate", 3: "Critical" };
              const starColors = { 1: "text-yellow-500", 2: "text-orange-400", 3: "text-red-400" };
              return (
                <Link key={s.threadId} href="/communications">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-sm text-zinc-300 truncate flex-1 font-mono">
                      {s.threadId.slice(0, 16)}...
                    </span>
                    <span className={`text-xs ${starColors[s.starLevel as keyof typeof starColors] || "text-zinc-400"}`}>
                      {"★".repeat(s.starLevel)} {starLabels[s.starLevel as keyof typeof starLabels] || ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pending approvals ─────────────────────────────────────────── */}
      {(hasPendingContacts || hasPendingCompanies) && (
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 space-y-2">
          <SectionHeader
            icon={<UserPlus className="h-4 w-4 text-blue-400" />}
            title="Pending Approvals"
            count={data.pendingContacts.length + data.pendingCompanies.length}
            color="bg-blue-950/40"
            linkTo="/relationships"
          />
          <div className="space-y-0.5 mt-2">
            {data.pendingContacts.map((c) => (
              <Link key={`c-${c.id}`} href={`/contact/${c.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <UserPlus className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-sm text-zinc-200 truncate flex-1">{c.name}</span>
                  {c.organization && (
                    <span className="text-xs text-zinc-500">{c.organization}</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-400">Contact</span>
                </div>
              </Link>
            ))}
            {data.pendingCompanies.map((c) => (
              <Link key={`co-${c.id}`} href={`/company/${c.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-sm text-zinc-200 truncate flex-1">{c.name}</span>
                  {c.sector && (
                    <span className="text-xs text-zinc-500">{c.sector}</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-400">Company</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent meetings ───────────────────────────────────────────── */}
      {hasRecentMeetings && (
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 space-y-2">
          <SectionHeader
            icon={<Calendar className="h-4 w-4 text-emerald-400" />}
            title="Recent Meetings"
            count={data.recentMeetings.length}
            color="bg-emerald-950/40"
            linkTo="/intelligence"
          />
          <div className="space-y-0.5 mt-2">
            {data.recentMeetings.map((m) => (
              <Link key={m.id} href={`/meeting/${m.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-sm text-zinc-200 truncate flex-1 group-hover:text-white">
                    {m.title}
                  </span>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {m.primaryLead}
                  </span>
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(m.meetingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
