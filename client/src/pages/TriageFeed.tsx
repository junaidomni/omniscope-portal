import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Mail,
  UserPlus,
  Building2,
  Calendar,
  Flame,
  Loader2,
  Check,
  Timer,
  ArrowRight,
  Sparkles,
  ListTodo,
  Users,
  BarChart3,
  Sun,
  Moon,
  Sunrise,
  ChevronRight,
  Trophy,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

// ─── Live clock hook ──────────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Time-aware greeting (uses browser local time) ────────────────────────
function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getSubGreeting(hour: number) {
  if (hour < 6) return "Burning the midnight oil? Here's what's pending.";
  if (hour < 12) return "Here's what needs your attention this morning.";
  if (hour < 17) return "Here's what's on your plate this afternoon.";
  if (hour < 21) return "Wrapping up the day — here's a summary.";
  return "Late night check-in — here's where things stand.";
}

function getTimeIcon(hour: number) {
  if (hour < 6) return <Moon className="h-5 w-5 text-indigo-400" />;
  if (hour < 12) return <Sunrise className="h-5 w-5 text-amber-400" />;
  if (hour < 17) return <Sun className="h-5 w-5 text-yellow-400" />;
  return <Moon className="h-5 w-5 text-indigo-400" />;
}

// ─── Priority badge ────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    high: { bg: "bg-red-500/20", text: "text-red-400", label: "High" },
    medium: { bg: "bg-yellow-500/15", text: "text-yellow-500", label: "Med" },
    low: { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "Low" },
  };
  const c = config[priority as keyof typeof config] || config.medium;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// ─── Task card (grid item) ─────────────────────────────────────────────────
function TaskCard({
  task,
  showOverdue,
  onComplete,
  onSnooze,
  isActing,
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
  onComplete: (id: number) => void;
  onSnooze: (id: number) => void;
  isActing: boolean;
}) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const now = new Date();
  const isOverdue = dueDate && dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysOverdue = dueDate
    ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const cleanTitle = task.title.replace(/\s*\(Assigned to:.*?\)\s*$/, "");

  return (
    <div className="group relative bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/60 hover:bg-zinc-900/80 transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        {showOverdue && isOverdue && daysOverdue > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/50 text-red-400 font-medium">
            {daysOverdue}d overdue
          </span>
        )}
        {dueDate && !isOverdue && (
          <span className="text-[10px] text-zinc-500">
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {task.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 ml-auto">
            {task.category}
          </span>
        )}
      </div>
      <Link href="/operations">
        <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2 hover:text-white transition-colors cursor-pointer mb-3">
          {cleanTitle}
        </p>
      </Link>
      <div className="flex items-center justify-between">
        {task.assignedName ? (
          <span className="text-[11px] text-zinc-500 truncate max-w-[140px]">{task.assignedName}</span>
        ) : (
          <span className="text-[11px] text-zinc-600 italic">Unassigned</span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
            disabled={isActing}
            className="p-1.5 rounded-lg hover:bg-emerald-950/50 text-zinc-500 hover:text-emerald-400 transition-colors"
            title="Mark complete"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSnooze(task.id); }}
            disabled={isActing}
            className="p-1.5 rounded-lg hover:bg-yellow-950/50 text-zinc-500 hover:text-yellow-400 transition-colors"
            title="Snooze 1 day"
          >
            <Timer className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Compact task row (for tomorrow/week lists) ───────────────────────────
function CompactTaskRow({
  task,
  showDate,
}: {
  task: { id: number; title: string; priority: string; dueDate: any; assignedName: string | null; category: string | null };
  showDate?: boolean;
}) {
  const cleanTitle = task.title.replace(/\s*\(Assigned to:.*?\)\s*$/, "");
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <Link href="/operations">
      <div className="group flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2.5 hover:border-zinc-700/50 transition-colors cursor-pointer">
        <PriorityBadge priority={task.priority} />
        <span className="text-sm text-zinc-200 truncate flex-1 group-hover:text-white transition-colors">
          {cleanTitle}
        </span>
        {showDate && dueDate && (
          <span className="text-[10px] text-zinc-500 shrink-0">
            {dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        )}
        {task.assignedName && (
          <span className="text-[10px] text-zinc-500 shrink-0 hidden sm:inline">{task.assignedName}</span>
        )}
        <ChevronRight className="h-3 w-3 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

// ─── Completed task row ───────────────────────────────────────────────────
function CompletedRow({
  task,
}: {
  task: { id: number; title: string; assignedName: string | null; completedAt: any };
}) {
  const cleanTitle = task.title.replace(/\s*\(Assigned to:.*?\)\s*$/, "");
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-950/10 border border-emerald-900/15">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      <span className="text-sm text-zinc-400 line-through truncate flex-1">{cleanTitle}</span>
      {task.assignedName && (
        <span className="text-[10px] text-zinc-600 shrink-0">{task.assignedName}</span>
      )}
    </div>
  );
}

// ─── Meeting card ─────────────────────────────────────────────────────────
function MeetingCard({
  meeting,
}: {
  meeting: { id: number; title: string | null; meetingDate: any; primaryLead: string; executiveSummary: string };
}) {
  const date = new Date(meeting.meetingDate);
  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
  const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/meeting/${meeting.id}`}>
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/60 hover:bg-zinc-900/80 transition-all duration-200 cursor-pointer group h-full">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-3.5 w-3.5 text-emerald-500/70" />
          <span className="text-[10px] text-zinc-500 font-medium">{dateLabel}</span>
        </div>
        <p className="text-sm text-zinc-200 font-medium group-hover:text-white transition-colors line-clamp-1 mb-1.5">
          {meeting.title || "Untitled Meeting"}
        </p>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          {meeting.executiveSummary?.slice(0, 120)}
          {(meeting.executiveSummary?.length ?? 0) > 120 ? "..." : ""}
        </p>
      </div>
    </Link>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────
function Section({
  icon,
  title,
  count,
  accentColor,
  linkTo,
  linkLabel,
  children,
  className,
  collapsible,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  accentColor: string;
  linkTo?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <button
          className="flex items-center gap-2.5"
          onClick={collapsible ? () => setOpen(!open) : undefined}
        >
          <div className={`p-1.5 rounded-lg ${accentColor}`}>{icon}</div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="text-xs text-zinc-500 font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded">
              {count}
            </span>
          )}
          {collapsible && (
            <ChevronRight className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${open ? "rotate-90" : ""}`} />
          )}
        </button>
        {linkTo && (
          <Link href={linkTo}>
            <span className="text-xs text-zinc-500 hover:text-yellow-500 transition-colors flex items-center gap-1 cursor-pointer">
              {linkLabel || "View all"} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        )}
      </div>
      {(!collapsible || open) && children}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  linkTo,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  linkTo?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div className={`border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700/50 transition-colors cursor-pointer ${
      highlight ? "bg-yellow-950/15 border-yellow-800/30" : "bg-zinc-900/40 border-zinc-800/40"
    }`}>
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <div className="text-lg font-bold font-mono text-white">{value}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
  return linkTo ? <Link href={linkTo}>{inner}</Link> : inner;
}

// ─── Main Triage Feed ──────────────────────────────────────────────────────
export default function TriageFeed() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.triage.feed.useQuery();
  const [actingTaskIds, setActingTaskIds] = useState<Set<number>>(new Set());
  const now = useLiveClock();

  const completeMutation = trpc.triage.completeTask.useMutation({
    onMutate: ({ taskId }) => setActingTaskIds((prev) => new Set(prev).add(taskId)),
    onSuccess: (_, { taskId }) => {
      toast.success("Task completed");
      setActingTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
      utils.triage.feed.invalidate();
    },
    onError: (_, { taskId }) => {
      setActingTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
      toast.error("Could not complete task");
    },
  });

  const snoozeMutation = trpc.triage.snoozeTask.useMutation({
    onMutate: ({ taskId }) => setActingTaskIds((prev) => new Set(prev).add(taskId)),
    onSuccess: (_, { taskId }) => {
      toast.success("Task snoozed to tomorrow");
      setActingTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
      utils.triage.feed.invalidate();
    },
    onError: (_, { taskId }) => {
      setActingTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
      toast.error("Could not snooze task");
    },
  });

  // Local time values
  const localHour = now.getHours();
  const greeting = getGreeting(localHour);
  const subGreeting = getSubGreeting(localHour);
  const timeIcon = getTimeIcon(localHour);
  const timeString = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  const dateString = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const tzAbbr = Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(now).find(p => p.type === "timeZoneName")?.value || "";

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
  const hasTomorrowTasks = (data.tomorrowTasks?.length ?? 0) > 0;
  const hasWeekTasks = (data.weekTasks?.length ?? 0) > 0;
  const hasCompletedToday = (data.completedTodayTasks?.length ?? 0) > 0;

  const nothingToTriage =
    !hasOverdue && !hasTodayTasks && !hasHighPriority && !hasStarredEmails && !hasPendingContacts && !hasPendingCompanies;

  // All today's tasks done state
  const allTodayDone = !hasOverdue && !hasTodayTasks && hasCompletedToday;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* ── Personal greeting with live clock ────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/40">
            {timeIcon}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {greeting}, <span className="text-yellow-500">{data.userName}</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{subGreeting}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xl font-mono text-white tracking-wider tabular-nums">
            {timeString}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{dateString}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{tzAbbr}</p>
        </div>
      </div>

      {/* ── Quick stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<ListTodo className="h-4 w-4 text-zinc-300" />} label="Open Tasks" value={summary.totalOpen} color="bg-zinc-800/60" linkTo="/operations" />
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-red-400" />} label="Overdue" value={summary.totalOverdue} color="bg-red-950/40" linkTo="/operations" highlight={summary.totalOverdue > 0} />
        <StatCard icon={<Flame className="h-4 w-4 text-yellow-400" />} label="High Priority" value={summary.totalHighPriority} color="bg-yellow-950/40" linkTo="/operations" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Done Today" value={summary.completedToday} color="bg-emerald-950/40" />
        <StatCard icon={<Star className="h-4 w-4 text-yellow-400" />} label="Starred Mail" value={summary.totalStarred} color="bg-yellow-950/40" linkTo="/communications" />
        <StatCard icon={<Users className="h-4 w-4 text-blue-400" />} label="Pending" value={summary.totalPendingApprovals} color="bg-blue-950/40" linkTo="/relationships" />
      </div>

      {/* ── All today's tasks done celebration ────────────────────────── */}
      {allTodayDone && (
        <div className="flex items-center gap-4 bg-emerald-950/15 border border-emerald-800/25 rounded-2xl p-5">
          <div className="p-3 rounded-full bg-emerald-950/40">
            <Trophy className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-emerald-400">All tasks completed for today</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              You've completed {data.completedTodayTasks?.length || 0} task{(data.completedTodayTasks?.length || 0) !== 1 ? "s" : ""} today.
              {hasTomorrowTasks ? ` ${data.tomorrowTasks?.length} task${(data.tomorrowTasks?.length ?? 0) !== 1 ? "s" : ""} coming up tomorrow.` : " Nothing scheduled for tomorrow."}
            </p>
          </div>
          <Link href="/operations">
            <span className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer">
              View all <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      )}

      {/* ── All clear state ───────────────────────────────────────────── */}
      {nothingToTriage && !allTodayDone && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-emerald-950/30 border border-emerald-800/30 mb-4">
            <Sparkles className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">All Clear</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Nothing requires your immediate attention. Check back later or review the overview for a broader picture.
          </p>
        </div>
      )}

      {/* ── Overdue tasks ────────────────────────────────────────────── */}
      {hasOverdue && (
        <Section
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
          title="Overdue"
          count={data.overdueTasks.length}
          accentColor="bg-red-950/40"
          linkTo="/operations"
          className="bg-red-950/5 border border-red-900/15 rounded-2xl p-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.overdueTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                showOverdue
                onComplete={(id) => completeMutation.mutate({ taskId: id })}
                onSnooze={(id) => snoozeMutation.mutate({ taskId: id, days: 1 })}
                isActing={actingTaskIds.has(t.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Due today ────────────────────────────────────────────────── */}
      {hasTodayTasks && (
        <Section
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          title="Due Today"
          count={data.todayTasks.length}
          accentColor="bg-yellow-950/40"
          linkTo="/operations"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.todayTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={(id) => completeMutation.mutate({ taskId: id })}
                onSnooze={(id) => snoozeMutation.mutate({ taskId: id, days: 1 })}
                isActing={actingTaskIds.has(t.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Two-column: High Priority + Starred/Approvals ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasHighPriority && (
          <Section
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            title="High Priority"
            count={data.highPriorityTasks.length}
            accentColor="bg-orange-950/40"
            linkTo="/operations"
          >
            <div className="space-y-2">
              {data.highPriorityTasks.slice(0, 6).map((t) => {
                const cleanTitle = t.title.replace(/\s*\(Assigned to:.*?\)\s*$/, "");
                return (
                  <div key={t.id} className="group flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2.5 hover:border-zinc-700/50 transition-colors">
                    <PriorityBadge priority={t.priority} />
                    <Link href="/operations">
                      <span className="text-sm text-zinc-200 truncate flex-1 hover:text-white transition-colors cursor-pointer">
                        {cleanTitle}
                      </span>
                    </Link>
                    {t.assignedName && (
                      <span className="text-[10px] text-zinc-500 shrink-0 hidden sm:inline">{t.assignedName}</span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => completeMutation.mutate({ taskId: t.id })}
                        disabled={actingTaskIds.has(t.id)}
                        className="p-1 rounded hover:bg-emerald-950/50 text-zinc-500 hover:text-emerald-400 transition-colors"
                        title="Complete"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <div className="space-y-6">
          {hasStarredEmails && (
            <Section
              icon={<Star className="h-4 w-4 text-yellow-500" />}
              title="Starred Emails"
              count={data.starredEmails.length}
              accentColor="bg-yellow-950/40"
              linkTo="/communications"
            >
              <div className="space-y-2">
                {data.starredEmails.map((s) => {
                  const starLabels: Record<number, string> = { 1: "Reply Today", 2: "Delegate", 3: "Critical" };
                  const starColors: Record<number, string> = { 1: "text-yellow-500", 2: "text-orange-400", 3: "text-red-400" };
                  return (
                    <Link key={s.threadId} href="/communications">
                      <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2.5 hover:border-zinc-700/50 transition-colors cursor-pointer">
                        <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-sm text-zinc-300 truncate flex-1 font-mono">
                          {s.threadId.slice(0, 16)}...
                        </span>
                        <span className={`text-xs ${starColors[s.starLevel] || "text-zinc-400"}`}>
                          {"★".repeat(s.starLevel)} {starLabels[s.starLevel] || ""}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}

          {(hasPendingContacts || hasPendingCompanies) && (
            <Section
              icon={<UserPlus className="h-4 w-4 text-blue-400" />}
              title="Pending Approvals"
              count={data.pendingContacts.length + data.pendingCompanies.length}
              accentColor="bg-blue-950/40"
              linkTo="/relationships"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.pendingContacts.map((c) => (
                  <Link key={`c-${c.id}`} href={`/contact/${c.id}`}>
                    <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2.5 hover:border-zinc-700/50 transition-colors cursor-pointer">
                      <UserPlus className="h-3.5 w-3.5 text-blue-400/60" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-200 truncate">{c.name}</p>
                        {c.organization && <p className="text-[10px] text-zinc-500 truncate">{c.organization}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
                {data.pendingCompanies.map((c) => (
                  <Link key={`co-${c.id}`} href={`/company/${c.id}`}>
                    <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2.5 hover:border-zinc-700/50 transition-colors cursor-pointer">
                      <Building2 className="h-3.5 w-3.5 text-purple-400/60" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-200 truncate">{c.name}</p>
                        {c.sector && <p className="text-[10px] text-zinc-500 truncate">{c.sector}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {!hasStarredEmails && !hasPendingContacts && !hasPendingCompanies && hasHighPriority && (
            <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <BarChart3 className="h-6 w-6 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500">No starred emails or pending approvals</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Completed today ──────────────────────────────────────────── */}
      {hasCompletedToday && (
        <Section
          icon={<Trophy className="h-4 w-4 text-emerald-400" />}
          title="Completed Today"
          count={data.completedTodayTasks?.length}
          accentColor="bg-emerald-950/40"
          collapsible
          defaultOpen={false}
        >
          <div className="space-y-1.5">
            {data.completedTodayTasks?.map((t) => (
              <CompletedRow key={t.id} task={t} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Tomorrow's tasks + This week ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasTomorrowTasks && (
          <Section
            icon={<Sunrise className="h-4 w-4 text-amber-400" />}
            title="Tomorrow"
            count={data.tomorrowTasks?.length}
            accentColor="bg-amber-950/40"
            linkTo="/operations"
            collapsible
          >
            <div className="space-y-1.5">
              {data.tomorrowTasks?.map((t) => (
                <CompactTaskRow key={t.id} task={t} />
              ))}
            </div>
          </Section>
        )}

        {hasWeekTasks && (
          <Section
            icon={<CalendarDays className="h-4 w-4 text-blue-400" />}
            title="This Week"
            count={data.weekTasks?.length}
            accentColor="bg-blue-950/40"
            linkTo="/operations"
            collapsible
          >
            <div className="space-y-1.5">
              {data.weekTasks?.map((t) => (
                <CompactTaskRow key={t.id} task={t} showDate />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ── Today's emails widget ────────────────────────────────────── */}
      <TodaysEmailsWidget />

      {/* ── Recent meetings ──────────────────────────────────────────── */}
      {hasRecentMeetings && (
        <Section
          icon={<Calendar className="h-4 w-4 text-emerald-400" />}
          title="Recent Intelligence"
          count={data.recentMeetings.length}
          accentColor="bg-emerald-950/40"
          linkTo="/intelligence"
          linkLabel="All meetings"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.recentMeetings.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Today's Emails Widget ────────────────────────────────────────────────
function TodaysEmailsWidget() {
  const { data: threads, isLoading } = trpc.mail.listThreads.useQuery(
    { folder: "inbox", page: 1, pageSize: 5 },
    { retry: false }
  );

  if (isLoading) return null;
  if (!threads?.threads?.length) return null;

  // Filter to today's emails only
  const today = new Date();
  const todayStr = today.toDateString();
  const todayEmails = threads.threads.filter((t: any) => {
    const d = t.lastMessageDate ? new Date(t.lastMessageDate) : null;
    return d && d.toDateString() === todayStr;
  });

  if (todayEmails.length === 0) return null;

  return (
    <Section
      icon={<Inbox className="h-4 w-4 text-violet-400" />}
      title="Today's Emails"
      count={todayEmails.length}
      accentColor="bg-violet-950/40"
      linkTo="/communications"
      linkLabel="Open inbox"
      collapsible
    >
      <div className="space-y-2">
        {todayEmails.slice(0, 8).map((t: any) => (
          <Link key={t.threadId} href="/communications">
            <div className="group flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2.5 hover:border-zinc-700/50 transition-colors cursor-pointer">
              <Mail className="h-3.5 w-3.5 text-violet-400/60 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                  {t.subject || "(no subject)"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {t.from || t.participants?.[0] || "Unknown sender"}
                </p>
              </div>
              {t.unread && (
                <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
              )}
              <span className="text-[10px] text-zinc-600 shrink-0">
                {t.lastMessageDate ? new Date(t.lastMessageDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
