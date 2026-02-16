import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, BarChart3, Download, Loader2, Send, Eye,
  ArrowUp, ArrowRight, ArrowDown, CheckCircle2,
  AlertTriangle, Lightbulb, Quote, Building2, Flag,
  Calendar, FileText, Clock
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

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
// STAT BOX
// ============================================================================

function StatBox({ label, value, accent }: { label: string; value: number; accent?: "red" | "yellow" | "green" }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <p className={`text-3xl font-bold ${
        accent === "red" ? "text-red-400" :
        accent === "yellow" ? "text-yellow-400" :
        accent === "green" ? "text-emerald-400" : "text-white"
      }`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

// ============================================================================
// TASK ROW FOR REPORTS
// ============================================================================

function TaskReportRow({ task }: { task: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
        task.status === "in_progress" ? "bg-yellow-500" : "bg-zinc-600"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.assignedName && (
            <span className="text-xs text-zinc-500">{task.assignedName}</span>
          )}
          {task.category && (
            <span className="text-xs text-zinc-600">· {task.category}</span>
          )}
          {task.dueDate && (
            <span className={`text-xs ${
              new Date(task.dueDate) < new Date() ? "text-red-400" : "text-zinc-600"
            }`}>
              · Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <PriorityBadge priority={task.priority} />
      <Badge variant="outline" className={`text-xs py-0 ${
        task.status === "in_progress" ? "border-yellow-600/30 text-yellow-500" : "border-zinc-700 text-zinc-500"
      }`}>
        {task.status === "in_progress" ? "In Progress" : "Open"}
      </Badge>
    </div>
  );
}

// ============================================================================
// MEETING REPORT CARD
// ============================================================================

function MeetingReportCard({ meeting, showFull }: { meeting: any; showFull: boolean }) {
  return (
    <Link href={`/meeting/${meeting.id}`}>
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-yellow-600/30 cursor-pointer transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{meeting.title}</p>
            <p className="text-xs text-yellow-600/80 mt-1">{meeting.participants.join(', ')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <span className="text-xs text-zinc-500">{meeting.time}</span>
            <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-xs">{meeting.sourceType}</Badge>
          </div>
        </div>
        {meeting.organizations.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1">
            <Building2 className="h-3 w-3 inline mr-1" />
            {meeting.organizations.join(', ')}
          </p>
        )}
        <p className="text-xs text-zinc-400 mt-2">{meeting.summary}</p>

        {showFull && (
          <>
            {meeting.keyHighlights.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase">Highlights</p>
                {meeting.keyHighlights.map((h: string, i: number) => (
                  <p key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    {h}
                  </p>
                ))}
              </div>
            )}

            {meeting.keyQuotes && meeting.keyQuotes.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase">Key Quotes</p>
                {meeting.keyQuotes.slice(0, 3).map((q: string, i: number) => (
                  <p key={i} className="text-xs text-zinc-500 italic flex items-start gap-1.5">
                    <Quote className="h-3 w-3 text-zinc-600 mt-0.5 flex-shrink-0" />
                    "{q}"
                  </p>
                ))}
              </div>
            )}

            {meeting.opportunities && meeting.opportunities.length > 0 && (
              <div className="mt-3 space-y-1.5">
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
      await navigator.clipboard.writeText(reportContent);
      toast.success("Report copied to clipboard. Paste into your email client.", { duration: 5000 });
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
// DAILY REPORT PAGE
// ============================================================================

export default function DailyReport() {
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
        text += `\nHIGH PRIORITY (${high.length})\n`;
        high.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
      if (med.length > 0) {
        text += `\nMEDIUM PRIORITY (${med.length})\n`;
        med.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
      if (low.length > 0) {
        text += `\nLOW PRIORITY (${low.length})\n`;
        low.forEach(t => { text += `  • ${t.title}${t.assignedName ? ` → ${t.assignedName}` : ''}\n`; });
      }
    }

    text += `\n═══════════════════════════════════════\n`;
    text += `Generated by OmniScope Intelligence Portal\n`;
    return text;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-8 w-8 bg-zinc-800/50 rounded" />
          <Skeleton className="h-8 w-64 bg-zinc-800/50" />
        </div>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 bg-zinc-800/50 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Link href="/meetings">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        </Link>
        <div className="text-center py-20">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-500">No data available for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back Navigation */}
      <Link href="/meetings">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>
      </Link>

      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-yellow-600/20 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Intelligence Report</h1>
            <p className="text-sm text-zinc-500 mt-1">
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
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setView("overview")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            view === "overview"
              ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/30"
              : "text-zinc-500 border border-zinc-800 hover:border-zinc-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setView("breakdown")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            view === "breakdown"
              ? "bg-yellow-600/20 text-yellow-500 border border-yellow-600/30"
              : "text-zinc-500 border border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <Eye className="h-3.5 w-3.5 inline mr-1.5" />
          Full Breakdown
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatBox label="Meetings" value={summary.meetingCount} />
        <StatBox label="Tasks Created" value={summary.tasksCreated} />
        <StatBox label="Tasks Done" value={summary.tasksCompleted} accent="green" />
        <StatBox label="Open Tasks" value={summary.openTasksCount} accent={summary.openTasksCount > 0 ? "red" : undefined} />
        <StatBox label="In Progress" value={summary.inProgressTasksCount} accent={summary.inProgressTasksCount > 0 ? "yellow" : undefined} />
      </div>

      {/* Active Verticals */}
      {(summary.topSectors.length > 0 || summary.topJurisdictions.length > 0) && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Active Verticals</h2>
          <div className="flex flex-wrap gap-2">
            {summary.topSectors.map(s => (
              <Badge key={s} variant="outline" className="border-yellow-600/30 text-yellow-600 text-xs px-3 py-1">{s}</Badge>
            ))}
            {summary.topJurisdictions.map(j => (
              <Badge key={j} variant="outline" className="border-zinc-700 text-zinc-400 text-xs px-3 py-1">{j}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Summaries */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Meeting Summaries ({summary.meetings.length})
        </h2>
        {summary.meetings.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-600">No meetings recorded today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.meetings.map(m => (
              <MeetingReportCard key={m.id} meeting={m} showFull={view === "breakdown"} />
            ))}
          </div>
        )}
      </div>

      {/* Full Breakdown Sections */}
      {view === "breakdown" && (
        <>
          {/* Opportunities */}
          {summary.allOpportunities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Lightbulb className="h-3.5 w-3.5 text-green-500" /> Opportunities
              </h2>
              <div className="space-y-2">
                {summary.allOpportunities.map((opp, i) => (
                  <p key={i} className="text-sm text-zinc-400 flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">▲</span>
                    {opp}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {summary.allRisks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Risks & Concerns
              </h2>
              <div className="space-y-2">
                {summary.allRisks.map((risk, i) => (
                  <p key={i} className="text-sm text-zinc-400 flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">▼</span>
                    {risk}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Tasks by Priority */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Active Tasks ({summary.allTasks.length})</h2>
            {summary.allTasks.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-8">No active tasks</p>
            ) : (
              <div className="space-y-4">
                {/* High Priority */}
                {summary.allTasks.filter(t => t.priority === "high").length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                      <Flag className="h-3 w-3" /> High Priority ({summary.allTasks.filter(t => t.priority === "high").length})
                    </p>
                    {summary.allTasks.filter(t => t.priority === "high").map(t => (
                      <TaskReportRow key={t.id} task={t} />
                    ))}
                  </div>
                )}
                {/* Medium Priority */}
                {summary.allTasks.filter(t => t.priority === "medium").length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-yellow-400 flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3" /> Medium Priority ({summary.allTasks.filter(t => t.priority === "medium").length})
                    </p>
                    {summary.allTasks.filter(t => t.priority === "medium").map(t => (
                      <TaskReportRow key={t.id} task={t} />
                    ))}
                  </div>
                )}
                {/* Low Priority */}
                {summary.allTasks.filter(t => t.priority === "low").length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                      <ArrowDown className="h-3 w-3" /> Low Priority ({summary.allTasks.filter(t => t.priority === "low").length})
                    </p>
                    {summary.allTasks.filter(t => t.priority === "low").map(t => (
                      <TaskReportRow key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Overview Mode: Task Count Summary */}
      {view === "overview" && summary.allTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Task Summary</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
              <p className="text-2xl font-bold text-red-400">{summary.allTasks.filter(t => t.priority === "high").length}</p>
              <p className="text-xs text-zinc-500 mt-1">High Priority</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-center">
              <p className="text-2xl font-bold text-yellow-400">{summary.allTasks.filter(t => t.priority === "medium").length}</p>
              <p className="text-xs text-zinc-500 mt-1">Medium Priority</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-400">{summary.allTasks.filter(t => t.priority === "low").length}</p>
              <p className="text-xs text-zinc-500 mt-1">Low Priority</p>
            </div>
          </div>
          <button
            onClick={() => setView("breakdown")}
            className="w-full text-center text-sm text-yellow-600 hover:text-yellow-500 py-3 mt-3 transition-colors"
          >
            View Full Breakdown →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-6 mt-8 text-center">
        <p className="text-xs text-zinc-600">Generated by OmniScope Intelligence Portal</p>
      </div>
    </div>
  );
}
