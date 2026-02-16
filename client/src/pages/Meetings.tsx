import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Users, Search, ChevronLeft, ChevronRight,
  FileText, Building2, Clock, User, Mail, Phone, Briefcase,
  Trash2, TrendingUp, BarChart3, Download, Loader2, X,
  Send, Eye, ArrowUp, ArrowRight, ArrowDown, CheckCircle2,
  AlertTriangle, Lightbulb, Quote, Flag
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ============================================================================
// MEETINGS PAGE - Main Container with Tabs
// ============================================================================

export default function Meetings() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'recent';
  });
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['recent', 'calendar', 'people'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Meetings</h1>
            <p className="text-sm text-zinc-500 mt-1">Intelligence reports, calendar, and contacts</p>
          </div>
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="recent" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="people" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-500">
              <Users className="h-4 w-4 mr-2" />
              People
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Daily & Weekly Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowDailyReport(true)}
            className="text-left p-4 rounded-xl bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 border border-yellow-600/20 hover:border-yellow-600/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Daily Report</p>
                  <p className="text-xs text-zinc-500">Today's meetings, tasks & intelligence</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => setShowWeeklyReport(true)}
            className="text-left p-4 rounded-xl bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 border border-yellow-600/20 hover:border-yellow-600/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Weekly Report</p>
                  <p className="text-xs text-zinc-500">Full week intelligence aggregated</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
            </div>
          </button>
        </div>

        <TabsContent value="recent" className="mt-0">
          <RecentMeetings />
        </TabsContent>
        <TabsContent value="calendar" className="mt-0">
          <MeetingsCalendar />
        </TabsContent>
        <TabsContent value="people" className="mt-0">
          <PeopleDirectory />
        </TabsContent>
      </Tabs>

      {/* Daily Report Dialog */}
      <Dialog open={showDailyReport} onOpenChange={setShowDailyReport}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DailyReportContent onClose={() => setShowDailyReport(false)} />
        </DialogContent>
      </Dialog>

      {/* Weekly Report Dialog */}
      <Dialog open={showWeeklyReport} onOpenChange={setShowWeeklyReport}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <WeeklyReportContent onClose={() => setShowWeeklyReport(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// PRIORITY BADGE
// ============================================================================

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { icon: any; color: string; bg: string }> = {
    high: { icon: ArrowUp, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    medium: { icon: ArrowRight, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    low: { icon: ArrowDown, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  };
  const c = config[priority] || config.medium;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`${c.bg} ${c.color} text-xs py-0 gap-1`}>
      <Icon className="h-3 w-3" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

// ============================================================================
// TASK LIST FOR REPORTS (grouped by priority)
// ============================================================================

function ReportTaskList({ tasks, title }: { tasks: any[]; title: string }) {
  const highPriority = tasks.filter(t => t.priority === "high");
  const mediumPriority = tasks.filter(t => t.priority === "medium");
  const lowPriority = tasks.filter(t => t.priority === "low");

  if (tasks.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-sm text-zinc-600 py-2 text-center">No active tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
        <span className="text-xs text-zinc-600">{tasks.length} active</span>
      </div>

      {highPriority.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
            <Flag className="h-3 w-3" /> High Priority ({highPriority.length})
          </p>
          {highPriority.map(t => (
            <TaskReportRow key={t.id} task={t} />
          ))}
        </div>
      )}

      {mediumPriority.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-yellow-400 flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3" /> Medium Priority ({mediumPriority.length})
          </p>
          {mediumPriority.map(t => (
            <TaskReportRow key={t.id} task={t} />
          ))}
        </div>
      )}

      {lowPriority.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
            <ArrowDown className="h-3 w-3" /> Low Priority ({lowPriority.length})
          </p>
          {lowPriority.map(t => (
            <TaskReportRow key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskReportRow({ task }: { task: any }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
        task.status === "in_progress" ? "bg-yellow-500" : "bg-zinc-600"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.assignedName && (
            <span className="text-[10px] text-zinc-500">{task.assignedName}</span>
          )}
          {task.category && (
            <span className="text-[10px] text-zinc-600">· {task.category}</span>
          )}
          {task.dueDate && (
            <span className={`text-[10px] ${
              new Date(task.dueDate) < new Date() ? "text-red-400" : "text-zinc-600"
            }`}>
              · Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <Badge variant="outline" className={`text-[10px] py-0 ${
        task.status === "in_progress" ? "border-yellow-600/30 text-yellow-500" : "border-zinc-700 text-zinc-500"
      }`}>
        {task.status === "in_progress" ? "In Progress" : "Open"}
      </Badge>
    </div>
  );
}

// ============================================================================
// EMAIL REPORT DIALOG
// ============================================================================

function EmailReportButton({ reportType, reportContent }: { reportType: "daily" | "weekly"; reportContent: string }) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setIsSending(true);
    try {
      // Use the export endpoint to get the formatted content, then trigger email
      const subject = reportType === "daily"
        ? `OmniScope Daily Intelligence Report — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : `OmniScope Weekly Intelligence Report — Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

      // For now, copy to clipboard and show instructions
      await navigator.clipboard.writeText(reportContent);
      toast.success("Report copied to clipboard. You can paste it into your email client.", { duration: 5000 });
      setShowEmailDialog(false);
    } catch {
      toast.error("Failed to prepare email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowEmailDialog(true)}
        className="border-zinc-700 text-zinc-400 hover:text-white hover:border-yellow-600/30"
      >
        <Send className="h-3.5 w-3.5 mr-1.5" />
        Email Report
      </Button>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-yellow-500" />
              Email {reportType === "daily" ? "Daily" : "Weekly"} Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Send to</label>
              <Input
                placeholder="email@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <p className="text-xs text-zinc-500">
              The full intelligence report will be copied to your clipboard for pasting into your email client.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowEmailDialog(false)} className="text-zinc-400">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendEmail}
                disabled={isSending}
                className="bg-yellow-600 hover:bg-yellow-500 text-black"
              >
                {isSending ? "Preparing..." : "Copy & Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// DAILY REPORT CONTENT - Full Breakdown
// ============================================================================

function DailyReportContent({ onClose }: { onClose: () => void }) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const { data: summary, isLoading } = trpc.analytics.dailySummary.useQuery({ date: todayStr });
  const [view, setView] = useState<"overview" | "breakdown">("overview");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/daily-brief/pdf?date=${todayStr}`);
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omniscope-daily-report-${todayStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Daily report exported");
    } catch {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  // Build plain text for email
  const buildReportText = () => {
    if (!summary) return "";
    let text = `OMNISCOPE DAILY INTELLIGENCE REPORT\n`;
    text += `${new Date(summary.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;
    text += `═══════════════════════════════════════\n\n`;
    text += `OVERVIEW\n`;
    text += `• Meetings: ${summary.meetingCount}\n`;
    text += `• Tasks Created: ${summary.tasksCreated}\n`;
    text += `• Tasks Completed: ${summary.tasksCompleted}\n`;
    text += `• Open Tasks: ${summary.openTasksCount}\n`;
    text += `• In Progress: ${summary.inProgressTasksCount}\n\n`;

    if (summary.meetings.length > 0) {
      text += `MEETING SUMMARIES\n`;
      text += `─────────────────\n`;
      summary.meetings.forEach(m => {
        text += `\n▸ ${m.title} (${m.time})\n`;
        text += `  Participants: ${m.participants.join(', ')}\n`;
        if (m.organizations.length > 0) text += `  Organizations: ${m.organizations.join(', ')}\n`;
        text += `  Summary: ${m.summary}\n`;
        if (m.keyHighlights.length > 0) {
          text += `  Key Highlights:\n`;
          m.keyHighlights.forEach(h => { text += `    • ${h}\n`; });
        }
      });
      text += `\n`;
    }

    if (summary.allTasks.length > 0) {
      text += `ACTIVE TASKS\n`;
      text += `─────────────\n`;
      const high = summary.allTasks.filter(t => t.priority === "high");
      const med = summary.allTasks.filter(t => t.priority === "medium");
      const low = summary.allTasks.filter(t => t.priority === "low");
      if (high.length > 0) {
        text += `\n🔴 HIGH PRIORITY (${high.length})\n`;
        high.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
      if (med.length > 0) {
        text += `\n🟡 MEDIUM PRIORITY (${med.length})\n`;
        med.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
      if (low.length > 0) {
        text += `\n🔵 LOW PRIORITY (${low.length})\n`;
        low.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
    }

    text += `\n═══════════════════════════════════════\n`;
    text += `Generated by OmniScope Intelligence Portal\n`;
    return text;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!summary) return <div className="p-6"><p className="text-zinc-500 text-sm">No data available</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daily Intelligence Report</h2>
              <p className="text-xs text-zinc-500">
                {new Date(summary.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EmailReportButton reportType="daily" reportContent={buildReportText()} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView("overview")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === "overview"
                ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/30"
                : "text-zinc-500 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView("breakdown")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === "breakdown"
                ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/30"
                : "text-zinc-500 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <Eye className="h-3 w-3 inline mr-1" />
            Full Breakdown
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-6">
        {/* Stats row - always visible */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBox label="Meetings" value={summary.meetingCount} />
          <StatBox label="Tasks Created" value={summary.tasksCreated} />
          <StatBox label="Tasks Done" value={summary.tasksCompleted} />
          <StatBox label="Open Tasks" value={summary.openTasksCount} accent={summary.openTasksCount > 0 ? "red" : undefined} />
          <StatBox label="In Progress" value={summary.inProgressTasksCount} accent={summary.inProgressTasksCount > 0 ? "yellow" : undefined} />
        </div>

        {/* Sectors & Jurisdictions */}
        {(summary.topSectors.length > 0 || summary.topJurisdictions.length > 0) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Verticals</p>
            <div className="flex flex-wrap gap-1.5">
              {summary.topSectors.map(s => (
                <Badge key={s} variant="outline" className="border-yellow-600/30 text-yellow-600 text-xs">{s}</Badge>
              ))}
              {summary.topJurisdictions.map(j => (
                <Badge key={j} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">{j}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Meeting summaries */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Meeting Summaries ({summary.meetings.length})
          </p>
          {summary.meetings.length === 0 ? (
            <p className="text-sm text-zinc-600 py-4 text-center">No meetings recorded today</p>
          ) : (
            summary.meetings.map(m => (
              <MeetingReportCard key={m.id} meeting={m} showFull={view === "breakdown"} />
            ))
          )}
        </div>

        {/* Full Breakdown sections */}
        {view === "breakdown" && (
          <>
            {/* Opportunities */}
            {summary.allOpportunities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-green-500" /> Opportunities
                </p>
                <div className="space-y-1.5">
                  {summary.allOpportunities.map((opp, i) => (
                    <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 p-2 rounded bg-green-500/5 border border-green-500/10">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">▲</span>
                      {opp}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {summary.allRisks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-red-500" /> Risks & Concerns
                </p>
                <div className="space-y-1.5">
                  {summary.allRisks.map((risk, i) => (
                    <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 p-2 rounded bg-red-500/5 border border-red-500/10">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">▼</span>
                      {risk}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks by priority */}
            <ReportTaskList tasks={summary.allTasks} title="Active Tasks" />
          </>
        )}

        {/* Overview mode: just show task count summary */}
        {view === "overview" && summary.allTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Task Summary</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
                <p className="text-lg font-bold text-red-400">{summary.allTasks.filter(t => t.priority === "high").length}</p>
                <p className="text-[10px] text-zinc-500">High Priority</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center">
                <p className="text-lg font-bold text-yellow-400">{summary.allTasks.filter(t => t.priority === "medium").length}</p>
                <p className="text-[10px] text-zinc-500">Medium Priority</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                <p className="text-lg font-bold text-blue-400">{summary.allTasks.filter(t => t.priority === "low").length}</p>
                <p className="text-[10px] text-zinc-500">Low Priority</p>
              </div>
            </div>
            <button
              onClick={() => setView("breakdown")}
              className="w-full text-center text-xs text-yellow-600 hover:text-yellow-500 py-2 transition-colors"
            >
              View Full Breakdown →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// WEEKLY REPORT CONTENT - Full Breakdown
// ============================================================================

function WeeklyReportContent({ onClose }: { onClose: () => void }) {
  const { data: summary, isLoading } = trpc.analytics.weeklySummary.useQuery({});
  const [view, setView] = useState<"overview" | "breakdown">("overview");
  const [isExporting, setIsExporting] = useState(false);
  const exportMutation = trpc.export.weeklySummary.useMutation();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportMutation.mutateAsync({});
      const blob = new Blob([result.content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Weekly report exported');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Build plain text for email
  const buildReportText = () => {
    if (!summary) return "";
    let text = `OMNISCOPE WEEKLY INTELLIGENCE REPORT\n`;
    text += `${new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(summary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;
    text += `═══════════════════════════════════════\n\n`;
    text += `OVERVIEW\n`;
    text += `• Meetings: ${summary.meetingCount}\n`;
    text += `• Unique Contacts: ${summary.uniqueParticipants}\n`;
    text += `• Organizations: ${summary.uniqueOrganizations}\n`;
    text += `• Tasks Created: ${summary.tasksCreated}\n`;
    text += `• Tasks Completed: ${summary.tasksCompleted}\n`;
    text += `• Open Tasks: ${summary.openTasksCount}\n\n`;

    if (summary.meetings && summary.meetings.length > 0) {
      text += `MEETING SUMMARIES\n`;
      text += `─────────────────\n`;
      summary.meetings.forEach(m => {
        text += `\n▸ ${m.title} — ${new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}\n`;
        text += `  Participants: ${m.participants.join(', ')}\n`;
        text += `  Summary: ${m.summary}\n`;
      });
      text += `\n`;
    }

    if (summary.allTasks && summary.allTasks.length > 0) {
      text += `ACTIVE TASKS\n`;
      text += `─────────────\n`;
      const high = summary.allTasks.filter(t => t.priority === "high");
      const med = summary.allTasks.filter(t => t.priority === "medium");
      const low = summary.allTasks.filter(t => t.priority === "low");
      if (high.length > 0) {
        text += `\n🔴 HIGH PRIORITY (${high.length})\n`;
        high.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
      if (med.length > 0) {
        text += `\n🟡 MEDIUM PRIORITY (${med.length})\n`;
        med.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
      if (low.length > 0) {
        text += `\n🔵 LOW PRIORITY (${low.length})\n`;
        low.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
    }

    text += `\n═══════════════════════════════════════\n`;
    text += `Generated by OmniScope Intelligence Portal\n`;
    return text;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!summary) return <div className="p-6"><p className="text-zinc-500 text-sm">No data available</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Weekly Intelligence Report</h2>
              <p className="text-xs text-zinc-500">
                {new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(summary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EmailReportButton reportType="weekly" reportContent={buildReportText()} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView("overview")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === "overview"
                ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/30"
                : "text-zinc-500 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView("breakdown")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === "breakdown"
                ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/30"
                : "text-zinc-500 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <Eye className="h-3 w-3 inline mr-1" />
            Full Breakdown
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBox label="Meetings" value={summary.meetingCount} />
          <StatBox label="Contacts" value={summary.uniqueParticipants} />
          <StatBox label="Tasks Created" value={summary.tasksCreated} />
          <StatBox label="Tasks Done" value={summary.tasksCompleted} />
          <StatBox label="Open Tasks" value={summary.openTasksCount} accent={summary.openTasksCount > 0 ? "red" : undefined} />
        </div>

        {/* Daily breakdown bar chart */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Daily Breakdown</p>
          <div className="flex items-end gap-2 h-24">
            {summary.dailyBreakdown.map((day, i) => {
              const maxCount = Math.max(...summary.dailyBreakdown.map(d => d.meetingCount), 1);
              const height = (day.meetingCount / maxCount) * 100;
              const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-500">{day.meetingCount}</span>
                  <div className="w-full rounded-t bg-zinc-800 relative" style={{ height: '80px' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-yellow-600/60"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sectors & Jurisdictions */}
        {(summary.topSectors.length > 0 || summary.topJurisdictions.length > 0) && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Verticals</p>
            <div className="space-y-2">
              {summary.topSectors.map(s => (
                <div key={s.sector} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{s.sector}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-600 rounded-full" style={{ width: `${Math.min((s.count / summary.meetingCount) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 w-4 text-right">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {summary.topJurisdictions.map(j => (
                <Badge key={j.jurisdiction} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                  {j.jurisdiction} ({j.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Opportunities - always visible */}
        {summary.keyOpportunities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3 text-green-500" /> Key Opportunities
            </p>
            <div className="space-y-1.5">
              {summary.keyOpportunities.slice(0, view === "breakdown" ? 20 : 5).map((opp, i) => (
                <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 p-2 rounded bg-green-500/5 border border-green-500/10">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">▲</span>
                  {opp}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Key Risks - always visible */}
        {summary.keyRisks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-red-500" /> Key Risks
            </p>
            <div className="space-y-1.5">
              {summary.keyRisks.slice(0, view === "breakdown" ? 20 : 5).map((risk, i) => (
                <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 p-2 rounded bg-red-500/5 border border-red-500/10">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">▼</span>
                  {risk}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Full Breakdown: Meeting details + Tasks */}
        {view === "breakdown" && (
          <>
            {/* All meetings this week */}
            {summary.meetings && summary.meetings.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  All Meetings This Week ({summary.meetings.length})
                </p>
                {summary.meetings.map(m => (
                  <Link key={m.id} href={`/meeting/${m.id}`}>
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-yellow-600/30 cursor-pointer transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{m.title}</p>
                          <p className="text-xs text-yellow-600/70 mt-0.5">{m.participants.join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-zinc-500">
                            {new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-xs">{m.sourceType}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{m.summary}</p>
                      {m.keyHighlights.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {m.keyHighlights.slice(0, 3).map((h, i) => (
                            <p key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                              <span className="text-yellow-600 mt-0.5">•</span>
                              {h}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Tasks by priority */}
            {summary.allTasks && <ReportTaskList tasks={summary.allTasks} title="Active Tasks" />}
          </>
        )}

        {/* Overview mode: task count summary */}
        {view === "overview" && summary.allTasks && summary.allTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Task Summary</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
                <p className="text-lg font-bold text-red-400">{summary.allTasks.filter(t => t.priority === "high").length}</p>
                <p className="text-[10px] text-zinc-500">High Priority</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center">
                <p className="text-lg font-bold text-yellow-400">{summary.allTasks.filter(t => t.priority === "medium").length}</p>
                <p className="text-[10px] text-zinc-500">Medium Priority</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                <p className="text-lg font-bold text-blue-400">{summary.allTasks.filter(t => t.priority === "low").length}</p>
                <p className="text-[10px] text-zinc-500">Low Priority</p>
              </div>
            </div>
            <button
              onClick={() => setView("breakdown")}
              className="w-full text-center text-xs text-yellow-600 hover:text-yellow-500 py-2 transition-colors"
            >
              View Full Breakdown →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MEETING REPORT CARD (used in daily report)
// ============================================================================

function MeetingReportCard({ meeting, showFull }: { meeting: any; showFull: boolean }) {
  return (
    <Link href={`/meeting/${meeting.id}`}>
      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-yellow-600/30 cursor-pointer transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{meeting.title}</p>
            <p className="text-xs text-yellow-600/70 mt-0.5">{meeting.participants.join(', ')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-xs text-zinc-500">{meeting.time}</span>
            <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-xs">{meeting.sourceType}</Badge>
          </div>
        </div>
        {meeting.organizations.length > 0 && (
          <p className="text-xs text-zinc-500 mt-0.5">
            <Building2 className="h-3 w-3 inline mr-1" />
            {meeting.organizations.join(', ')}
          </p>
        )}
        <p className="text-xs text-zinc-400 mt-1.5">{meeting.summary}</p>

        {showFull && (
          <>
            {/* Key Highlights */}
            {meeting.keyHighlights.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase">Highlights</p>
                {meeting.keyHighlights.map((h: string, i: number) => (
                  <p key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    {h}
                  </p>
                ))}
              </div>
            )}

            {/* Key Quotes */}
            {meeting.keyQuotes && meeting.keyQuotes.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase">Key Quotes</p>
                {meeting.keyQuotes.slice(0, 3).map((q: string, i: number) => (
                  <p key={i} className="text-xs text-zinc-500 italic flex items-start gap-1.5">
                    <Quote className="h-3 w-3 text-zinc-600 mt-0.5 flex-shrink-0" />
                    "{q}"
                  </p>
                ))}
              </div>
            )}

            {/* Opportunities from this meeting */}
            {meeting.opportunities && meeting.opportunities.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase">Opportunities</p>
                {meeting.opportunities.map((o: string, i: number) => (
                  <p key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">▲</span>
                    {o}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// STAT BOX
// ============================================================================

function StatBox({ label, value, accent }: { label: string; value: number; accent?: "red" | "yellow" }) {
  return (
    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-center">
      <p className={`text-2xl font-bold ${
        accent === "red" ? "text-red-400" :
        accent === "yellow" ? "text-yellow-400" : "text-white"
      }`}>{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

// ============================================================================
// RECENT MEETINGS - Compact list, newest first, grouped by week
// ============================================================================

function RecentMeetings() {
  const { data: meetings, isLoading } = trpc.meetings.list.useQuery({ limit: 100, offset: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const utils = trpc.useUtils();
  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      toast.success("Meeting deleted");
      utils.meetings.list.invalidate();
      utils.analytics.dashboard.invalidate();
    },
    onError: () => toast.error("Failed to delete meeting"),
  });

  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];
    if (!searchTerm) return meetings;
    const lower = searchTerm.toLowerCase();
    return meetings.filter(m => {
      const participants = (() => { try { return JSON.parse(m.participants || '[]'); } catch { return []; } })();
      const orgs = (() => { try { return JSON.parse(m.organizations || '[]'); } catch { return []; } })();
      const title = m.meetingTitle || '';
      return (
        title.toLowerCase().includes(lower) ||
        participants.join(' ').toLowerCase().includes(lower) ||
        orgs.join(' ').toLowerCase().includes(lower) ||
        m.executiveSummary?.toLowerCase().includes(lower) ||
        m.primaryLead?.toLowerCase().includes(lower)
      );
    });
  }, [meetings, searchTerm]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredMeetings> = {};
    for (const m of filteredMeetings) {
      const d = new Date(m.meetingDate);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredMeetings]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 bg-zinc-800/50 rounded-lg" />
        ))}
      </div>
    );
  }

  const formatWeekLabel = (weekStartStr: string) => {
    const ws = new Date(weekStartStr + 'T00:00:00');
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    if (ws.toDateString() === thisWeekStart.toDateString()) return "This Week";
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    if (ws.toDateString() === lastWeekStart.toDateString()) return "Last Week";

    return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search meetings by title, name, org, or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
        />
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-500">No meetings found</p>
        </div>
      ) : (
        grouped.map(([weekKey, weekMeetings]) => (
          <div key={weekKey}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              {formatWeekLabel(weekKey)}
            </h3>
            <div className="space-y-2">
              {weekMeetings.map(meeting => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  onDelete={() => {
                    if (confirm("Delete this meeting and all associated data?")) {
                      deleteMutation.mutate({ id: meeting.id });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MeetingRow({ meeting, onDelete }: { meeting: any; onDelete: () => void }) {
  const participants = (() => { try { return JSON.parse(meeting.participants || '[]'); } catch { return []; } })();
  const organizations = (() => { try { return JSON.parse(meeting.organizations || '[]'); } catch { return []; } })();
  const tags = trpc.meetings.getTags.useQuery({ meetingId: meeting.id });
  const displayTitle = meeting.meetingTitle || participants.join(', ') || 'Untitled Meeting';

  return (
    <div className="group flex items-center gap-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-yellow-600/30 transition-all">
      <div className="w-14 text-center flex-shrink-0">
        <p className="text-xs text-zinc-500">
          {new Date(meeting.meetingDate).toLocaleDateString('en-US', { month: 'short' })}
        </p>
        <p className="text-lg font-bold text-white leading-tight">
          {new Date(meeting.meetingDate).getDate()}
        </p>
        <p className="text-xs text-zinc-600">
          {new Date(meeting.meetingDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>

      <Separator orientation="vertical" className="h-10 bg-zinc-800" />

      <Link href={`/meeting/${meeting.id}`} className="flex-1 min-w-0 cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{displayTitle}</p>
            <p className="text-xs text-yellow-600/80 mt-0.5 truncate">{participants.join(', ')}</p>
            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{meeting.executiveSummary}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {organizations.length > 0 && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs hidden sm:flex">
                <Building2 className="h-3 w-3 mr-1" />
                {organizations[0]}
              </Badge>
            )}
            {tags.data && tags.data.length > 0 && (
              <Badge variant="outline" className="border-yellow-600/30 bg-yellow-600/10 text-yellow-600 text-xs hidden md:flex">
                {tags.data[0].tag.name}
              </Badge>
            )}
            <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-xs">
              {meeting.sourceType}
            </Badge>
          </div>
        </div>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// MEETINGS CALENDAR
// ============================================================================

function MeetingsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: meetings } = trpc.meetings.list.useQuery({ limit: 100, offset: 0 });

  const getLocalDateKey = (dateStr: string | Date): string => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const meetingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (!meetings) return map;
    for (const m of meetings) {
      const dateKey = getLocalDateKey(m.meetingDate as any);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(m);
    }
    return map;
  }, [meetings]);

  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] || []) : [];
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push(dateStr);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="text-zinc-400 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="text-zinc-400 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs text-zinc-600 font-medium py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} className="h-14" />;
            const dayNum = parseInt(dateStr.split('-')[2]);
            const hasMeetings = meetingsByDate[dateStr]?.length > 0;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`h-14 rounded-lg flex flex-col items-center justify-center transition-all relative
                  ${isSelected ? 'bg-yellow-600/20 border border-yellow-600/40' :
                    isToday ? 'bg-zinc-800 border border-zinc-700' :
                    'hover:bg-zinc-800/50 border border-transparent'}
                `}
              >
                <span className={`text-sm ${isToday ? 'text-yellow-500 font-bold' : isSelected ? 'text-white font-medium' : 'text-zinc-400'}`}>
                  {dayNum}
                </span>
                {hasMeetings && (
                  <div className="flex gap-0.5 mt-1">
                    {meetingsByDate[dateStr].slice(0, 3).map((_, idx) => (
                      <span key={idx} className="h-1 w-1 rounded-full bg-yellow-600" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Card className="bg-zinc-900/50 border-zinc-800 sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-zinc-500">Click a date to see meetings</p>
            ) : selectedMeetings.length === 0 ? (
              <p className="text-sm text-zinc-500">No meetings on this date</p>
            ) : (
              <div className="space-y-3">
                {selectedMeetings.map((m: any) => {
                  const participants = (() => { try { return JSON.parse(m.participants || '[]'); } catch { return []; } })();
                  const displayTitle = m.meetingTitle || participants.join(', ') || 'Untitled Meeting';
                  return (
                    <Link key={m.id} href={`/meeting/${m.id}`}>
                      <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-yellow-600/30 cursor-pointer transition-all">
                        <p className="text-sm font-medium text-white">{displayTitle}</p>
                        <p className="text-xs text-yellow-600/70 mt-0.5">{participants.join(', ')}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(m.meetingDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {' · '}{m.sourceType}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{m.executiveSummary}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// PEOPLE DIRECTORY
// ============================================================================

function PeopleDirectory() {
  const { data: contacts, isLoading: contactsLoading, refetch: refetchContacts } = trpc.contacts.list.useQuery();
  const { data: meetings, isLoading: meetingsLoading } = trpc.meetings.list.useQuery({ limit: 100, offset: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const deleteContactMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted");
      refetchContacts();
      setSelectedPerson(null);
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  const isLoading = contactsLoading || meetingsLoading;

  const people = useMemo(() => {
    if (!meetings) return [];
    const nameMap = new Map<string, {
      name: string;
      orgs: Set<string>;
      emails: Set<string>;
      meetingCount: number;
      lastMeeting: string;
      meetingIds: number[];
    }>();

    for (const m of meetings) {
      const participants = (() => { try { return JSON.parse(m.participants || '[]') as string[]; } catch { return []; } })();
      const orgs = (() => { try { return JSON.parse(m.organizations || '[]') as string[]; } catch { return []; } })();

      for (const p of participants) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        const existing = nameMap.get(key);
        if (existing) {
          existing.meetingCount++;
          orgs.forEach(o => existing.orgs.add(o));
          existing.meetingIds.push(m.id);
          if (new Date(m.meetingDate) > new Date(existing.lastMeeting)) {
            existing.lastMeeting = m.meetingDate as any;
          }
        } else {
          nameMap.set(key, {
            name: trimmed,
            orgs: new Set(orgs),
            emails: new Set(),
            meetingCount: 1,
            lastMeeting: m.meetingDate as any,
            meetingIds: [m.id],
          });
        }
      }
    }

    if (contacts) {
      for (const c of contacts) {
        const key = c.name.toLowerCase();
        const existing = nameMap.get(key);
        if (existing) {
          if (c.email) existing.emails.add(c.email);
          if (c.organization) existing.orgs.add(c.organization);
        }
      }
    }

    return Array.from(nameMap.values())
      .sort((a, b) => b.meetingCount - a.meetingCount);
  }, [contacts, meetings]);

  const filteredPeople = useMemo(() => {
    if (!searchTerm) return people;
    const lower = searchTerm.toLowerCase();
    return people.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      Array.from(p.orgs).join(' ').toLowerCase().includes(lower) ||
      Array.from(p.emails).join(' ').toLowerCase().includes(lower)
    );
  }, [people, searchTerm]);

  const personMeetings = useMemo(() => {
    if (!selectedPerson || !meetings) return [];
    return meetings.filter(m => {
      const participants = (() => { try { return JSON.parse(m.participants || '[]') as string[]; } catch { return []; } })();
      return participants.some(p => p.toLowerCase() === selectedPerson.toLowerCase());
    }).sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  }, [selectedPerson, meetings]);

  const selectedPersonData = people.find(p => p.name.toLowerCase() === selectedPerson?.toLowerCase());

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-14 bg-zinc-800/50 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search people by name or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>

        <p className="text-xs text-zinc-600">{filteredPeople.length} contacts</p>

        {filteredPeople.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-500">No contacts found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPeople.map(person => (
              <button
                key={person.name}
                onClick={() => setSelectedPerson(
                  selectedPerson?.toLowerCase() === person.name.toLowerCase() ? null : person.name
                )}
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all text-left
                  ${selectedPerson?.toLowerCase() === person.name.toLowerCase()
                    ? 'bg-yellow-600/10 border border-yellow-600/30'
                    : 'bg-zinc-900/30 border border-transparent hover:bg-zinc-800/50 hover:border-zinc-800'}
                `}
              >
                <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-yellow-600">
                    {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{person.name}</p>
                  {person.orgs.size > 0 && (
                    <p className="text-xs text-zinc-500 truncate">{Array.from(person.orgs).join(', ')}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-zinc-500">
                    {person.meetingCount} meeting{person.meetingCount !== 1 ? 's' : ''}
                  </p>
                  {person.emails.size > 0 && (
                    <p className="text-xs text-zinc-600 truncate max-w-32">{Array.from(person.emails)[0]}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <Card className="bg-zinc-900/50 border-zinc-800 sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              {selectedPersonData ? selectedPersonData.name : 'Select a person'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPersonData ? (
              <p className="text-sm text-zinc-500">Click a name to see their profile and meeting history</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {selectedPersonData.orgs.size > 0 && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Building2 className="h-4 w-4 text-zinc-600" />
                      <span>{Array.from(selectedPersonData.orgs).join(', ')}</span>
                    </div>
                  )}
                  {selectedPersonData.emails.size > 0 && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="h-4 w-4 text-zinc-600" />
                      {Array.from(selectedPersonData.emails).map(email => (
                        <a key={email} href={`mailto:${email}`} className="hover:text-yellow-500 transition-colors">
                          {email}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar className="h-4 w-4 text-zinc-600" />
                    <span>Last seen: {new Date(selectedPersonData.lastMeeting).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                {contacts?.find(c => c.name.toLowerCase() === selectedPerson?.toLowerCase()) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const contact = contacts?.find(c => c.name.toLowerCase() === selectedPerson?.toLowerCase());
                      if (contact && confirm(`Remove ${contact.name} from contacts?`)) {
                        deleteContactMutation.mutate({ id: contact.id });
                      }
                    }}
                    className="w-full border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    disabled={deleteContactMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteContactMutation.isPending ? 'Deleting...' : 'Delete Contact'}
                  </Button>
                )}

                <Separator className="bg-zinc-800" />

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Meetings ({personMeetings.length})
                  </h4>
                  {personMeetings.length === 0 ? (
                    <p className="text-sm text-zinc-600">No meetings found</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {personMeetings.map(m => {
                        const participants = (() => { try { return JSON.parse(m.participants || '[]'); } catch { return []; } })();
                        const displayTitle = m.meetingTitle || participants.join(', ') || 'Untitled Meeting';
                        return (
                          <Link key={m.id} href={`/meeting/${m.id}`}>
                            <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-yellow-600/30 cursor-pointer transition-all">
                              <p className="text-sm font-medium text-white truncate">{displayTitle}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {new Date(m.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{m.executiveSummary}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
