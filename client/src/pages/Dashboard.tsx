import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Calendar, TrendingUp, Users, CheckSquare, FileText,
  Building2, Download, Clock, ArrowRight, Sparkles,
  AlertCircle, Globe, ChevronRight, Video, ExternalLink,
  BarChart3, GripVertical, RotateCcw
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// ============================================================================
// TIMEZONE CLOCKS (compact strip)
// ============================================================================

const TIMEZONES = [
  { label: "EST", zone: "America/New_York", city: "New York" },
  { label: "PST", zone: "America/Los_Angeles", city: "LA" },
  { label: "GMT", zone: "Europe/London", city: "London" },
  { label: "GST", zone: "Asia/Dubai", city: "Dubai" },
  { label: "PKT", zone: "Asia/Karachi", city: "Islamabad" },
  { label: "JST", zone: "Asia/Tokyo", city: "Tokyo" },
];

function MiniClock({ zone, city }: { zone: string; city: string }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", {
        timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true,
      }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [zone]);
  return (
    <div className="text-center">
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{city}</p>
      <p className="text-sm font-semibold text-zinc-300 tabular-nums">{time}</p>
    </div>
  );
}

// ============================================================================
// DRAGGABLE GRID SYSTEM
// ============================================================================

const DEFAULT_WIDGET_ORDER = [
  "upcoming-schedule",
  "daily-report",
  "recent-intelligence",
  "weekly-report",
  "active-verticals",
  "priority-tasks",
  "quick-actions",
];

const STORAGE_KEY = "omniscope-dashboard-layout";

function useDashboardLayout() {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all default widgets are present
        const allWidgets = Array.from(new Set([...parsed, ...DEFAULT_WIDGET_ORDER]));
        return allWidgets;
      }
    } catch {}
    return DEFAULT_WIDGET_ORDER;
  });

  const saveOrder = useCallback((order: string[]) => {
    setWidgetOrder(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, []);

  const resetOrder = useCallback(() => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Dashboard layout reset to default");
  }, []);

  return { widgetOrder, saveOrder, resetOrder };
}

// ============================================================================
// DASHBOARD
// ============================================================================

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: string[];
  hangoutLink?: string;
  isAllDay: boolean;
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = trpc.analytics.dashboard.useQuery();
  const { data: allMeetings = [] } = trpc.meetings.list.useQuery({ limit: 10 });
  const { data: allTasks = [] } = trpc.tasks.list.useQuery({ status: "open" });
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { widgetOrder, saveOrder, resetOrder } = useDashboardLayout();
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);

  const handleExportDailyBrief = async () => {
    setIsExporting(true);
    try {
      const n = new Date();
      const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      const response = await fetch(`/api/daily-brief/pdf?date=${today}`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omniscope-daily-brief-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Daily brief exported as PDF");
    } catch {
      toast.error("Failed to export daily brief");
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch upcoming Google Calendar events
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const now = new Date();
        const weekLater = new Date(now);
        weekLater.setDate(weekLater.getDate() + 7);
        const response = await fetch(`/api/calendar/events?` + new URLSearchParams({
          timeMin: now.toISOString(),
          timeMax: weekLater.toISOString(),
          maxResults: "20",
        }));
        if (response.ok) {
          const data = await response.json();
          setUpcomingEvents(data.events || []);
        }
      } catch (err) {
        console.error("Failed to fetch upcoming events:", err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  const parseMeetingParticipants = (m: any) => {
    try { return JSON.parse(m.participants || "[]"); } catch { return []; }
  };
  const parseMeetingOrgs = (m: any) => {
    try { return JSON.parse(m.organizations || "[]"); } catch { return []; }
  };

  const urgentTasks = useMemo(() => {
    return allTasks
      .filter((t: any) => t.priority === "high" || (t.dueDate && new Date(t.dueDate) < new Date()))
      .slice(0, 5);
  }, [allTasks]);

  // Drag handlers for widget reordering
  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    if (draggedWidget && draggedWidget !== widgetId) {
      setDragOverWidget(widgetId);
    }
  };

  const handleDrop = (targetWidgetId: string) => {
    if (!draggedWidget || draggedWidget === targetWidgetId) return;
    const newOrder = [...widgetOrder];
    const dragIdx = newOrder.indexOf(draggedWidget);
    const dropIdx = newOrder.indexOf(targetWidgetId);
    if (dragIdx === -1 || dropIdx === -1) return;
    newOrder.splice(dragIdx, 1);
    newOrder.splice(dropIdx, 0, draggedWidget);
    saveOrder(newOrder);
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  // Widget renderer
  const renderWidget = (widgetId: string) => {
    const isDragging = draggedWidget === widgetId;
    const isDragOver = dragOverWidget === widgetId;

    const wrapperProps = isCustomizing ? {
      draggable: true,
      onDragStart: () => handleDragStart(widgetId),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, widgetId),
      onDrop: () => handleDrop(widgetId),
      onDragEnd: handleDragEnd,
    } : {};

    const wrapperClass = `transition-all ${isCustomizing ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-40 scale-95' : ''} ${isDragOver ? 'ring-2 ring-yellow-600/50 rounded-xl' : ''}`;

    switch (widgetId) {
      case "upcoming-schedule":
        return (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Upcoming Schedule" />}
            <UpcomingScheduleWidget events={upcomingEvents} loading={eventsLoading} />
          </div>
        );
      case "daily-report":
        return (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Daily Report" />}
            <DailyReportWidget />
          </div>
        );
      case "recent-intelligence":
        return (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Recent Intelligence" />}
            <RecentIntelligenceWidget meetings={allMeetings} parseMeetingParticipants={parseMeetingParticipants} />
          </div>
        );
      case "weekly-report":
        return (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Weekly Report" />}
            <WeeklyReportWidget />
          </div>
        );
      case "active-verticals":
        return (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Active Verticals" />}
            <ActiveVerticalsWidget metrics={metrics} />
          </div>
        );
      case "priority-tasks":
        return urgentTasks.length > 0 ? (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Priority Tasks" />}
            <PriorityTasksWidget tasks={urgentTasks} />
          </div>
        ) : null;
      case "quick-actions":
        return (
          <div key={widgetId} className={wrapperClass} {...wrapperProps}>
            {isCustomizing && <WidgetDragHandle label="Quick Actions" />}
            <QuickActionsWidget />
          </div>
        );
      default:
        return null;
    }
  };

  if (metricsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-4 w-20 bg-zinc-800 mb-2" />
                <Skeleton className="h-8 w-12 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header + Timezone Strip */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-sm text-zinc-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            {isCustomizing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400 hover:text-white"
                  onClick={resetOrder}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-500 text-black"
                  onClick={() => { setIsCustomizing(false); toast.success("Layout saved"); }}
                >
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400 hover:text-white"
                  onClick={() => setIsCustomizing(true)}
                >
                  <GripVertical className="h-3.5 w-3.5 mr-1.5" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400 hover:text-white"
                  onClick={handleExportDailyBrief}
                  disabled={isExporting}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {isExporting ? "Exporting..." : "Export Daily Brief"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Timezone Strip */}
        <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900/30 rounded-lg border border-zinc-800/50 overflow-x-auto">
          <Globe className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
          {TIMEZONES.map((tz, idx) => (
            <div key={tz.zone} className="flex items-center gap-3">
              <MiniClock zone={tz.zone} city={tz.city} />
              {idx < TIMEZONES.length - 1 && <Separator orientation="vertical" className="h-6 bg-zinc-800" />}
            </div>
          ))}
        </div>
      </div>

      {/* Customization Banner */}
      {isCustomizing && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-600/10 border border-yellow-600/30 flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-yellow-500" />
          <p className="text-sm text-yellow-500">Drag and drop widgets to rearrange your dashboard layout</p>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Today" value={metrics?.meetingsToday || 0} sub={`${metrics?.meetingsThisWeek || 0} this week`} icon={<Calendar className="h-4 w-4" />} href="/calendar" />
        <MetricCard title="Contacts" value={metrics?.uniqueParticipants || 0} sub={`${metrics?.uniqueOrganizations || 0} orgs`} icon={<Users className="h-4 w-4" />} href="/meetings?tab=people" />
        <MetricCard title="Open Tasks" value={metrics?.openTasks || 0} sub={`${metrics?.completedTasksToday || 0} done today`} icon={<CheckSquare className="h-4 w-4" />} accent={metrics?.openTasks && metrics.openTasks > 10 ? "red" : undefined} href="/tasks" />
        <MetricCard title="Total Intel" value={metrics?.totalMeetings || 0} sub={`${metrics?.meetingsThisMonth || 0} this month`} icon={<TrendingUp className="h-4 w-4" />} href="/meetings" />
      </div>

      {/* Draggable Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgetOrder.map(id => renderWidget(id)).filter(Boolean)}
      </div>
    </div>
  );
}

// ============================================================================
// WIDGET DRAG HANDLE
// ============================================================================

function WidgetDragHandle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 px-1">
      <GripVertical className="h-3.5 w-3.5 text-yellow-600" />
      <span className="text-[10px] text-yellow-600 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

// ============================================================================
// DAILY REPORT WIDGET
// ============================================================================

function DailyReportWidget() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const { data: summary } = trpc.analytics.dailySummary.useQuery({ date: todayStr });

  return (
    <Link href="/reports/daily">
      <Card className="bg-gradient-to-br from-yellow-600/8 to-zinc-900/50 border-yellow-600/20 hover:border-yellow-600/40 transition-all cursor-pointer group">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                <BarChart3 className="h-4.5 w-4.5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Daily Report</p>
                <p className="text-[11px] text-zinc-500">Today's intelligence summary</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center p-2 rounded-md bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.meetingCount}</p>
                <p className="text-[10px] text-zinc-500">Meetings</p>
              </div>
              <div className="text-center p-2 rounded-md bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.tasksCreated}</p>
                <p className="text-[10px] text-zinc-500">Tasks</p>
              </div>
              <div className="text-center p-2 rounded-md bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.meetings?.reduce((acc, m) => acc + (m.participants?.length || 0), 0) ?? 0}</p>
                <p className="text-[10px] text-zinc-500">Contacts</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// WEEKLY REPORT WIDGET
// ============================================================================

function WeeklyReportWidget() {
  const { data: summary } = trpc.analytics.weeklySummary.useQuery({});

  return (
    <Link href="/reports/weekly">
      <Card className="bg-gradient-to-br from-yellow-600/8 to-zinc-900/50 border-yellow-600/20 hover:border-yellow-600/40 transition-all cursor-pointer group">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Weekly Report</p>
                <p className="text-[11px] text-zinc-500">Full week intelligence</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center p-2 rounded-md bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.meetingCount}</p>
                <p className="text-[10px] text-zinc-500">Meetings</p>
              </div>
              <div className="text-center p-2 rounded-md bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.tasksCreated}</p>
                <p className="text-[10px] text-zinc-500">Tasks</p>
              </div>
              <div className="text-center p-2 rounded-md bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.uniqueParticipants}</p>
                <p className="text-[10px] text-zinc-500">Contacts</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// UPCOMING SCHEDULE WIDGET
// ============================================================================

function UpcomingScheduleWidget({ events, loading }: { events: CalendarEvent[]; loading: boolean }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300">Upcoming Schedule</CardTitle>
          <Link href="/calendar">
            <span className="text-xs text-yellow-600 hover:text-yellow-500 cursor-pointer flex items-center gap-1">
              View Calendar <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 bg-zinc-800 rounded-lg" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-xs text-zinc-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 8).map(event => {
              const startDate = new Date(event.start);
              const isToday = startDate.toDateString() === new Date().toDateString();
              const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

              return (
                <div key={event.id} className={`p-2.5 rounded-lg border transition-all ${isToday ? 'bg-yellow-600/5 border-yellow-600/20' : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.summary}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        <span>{dayLabel}</span>
                        {!event.isAllDay && (
                          <span>
                            {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>
                    {event.hangoutLink && (
                      <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-500 ml-2" onClick={e => e.stopPropagation()}>
                        <Video className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {event.attendees.length > 0 && (
                    <p className="text-[11px] text-zinc-600 mt-1 truncate">{event.attendees.slice(0, 3).join(", ")}{event.attendees.length > 3 ? ` +${event.attendees.length - 3}` : ""}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RECENT INTELLIGENCE WIDGET
// ============================================================================

function RecentIntelligenceWidget({ meetings, parseMeetingParticipants }: { meetings: any[]; parseMeetingParticipants: (m: any) => string[] }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300">Recent Intelligence</CardTitle>
          <Link href="/meetings">
            <span className="text-xs text-yellow-600 hover:text-yellow-500 cursor-pointer flex items-center gap-1">
              All Meetings <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-xs text-zinc-500">No meetings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.slice(0, 8).map((meeting: any) => {
              const participants = parseMeetingParticipants(meeting);
              return (
                <Link key={meeting.id} href={`/meeting/${meeting.id}`}>
                  <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800 hover:border-yellow-600/20 transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {meeting.meetingTitle || (participants.length > 0 ? participants.join(", ") : "Unnamed Meeting")}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(meeting.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {participants.length > 0 && ` · ${participants.join(", ")}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px] px-1.5 py-0 ml-2 flex-shrink-0">
                        {meeting.sourceType}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5">{meeting.executiveSummary}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACTIVE VERTICALS WIDGET
// ============================================================================

function ActiveVerticalsWidget({ metrics }: { metrics: any }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">Active Verticals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics?.topSectors?.slice(0, 5).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">{item.sector}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-600 rounded-full" style={{ width: `${Math.min((item.count / (metrics?.totalMeetings || 1)) * 100, 100)}%` }} />
                </div>
                <span className="text-xs font-medium text-zinc-400 w-5 text-right">{item.count}</span>
              </div>
            </div>
          ))}
          {(!metrics?.topSectors || metrics.topSectors.length === 0) && (
            <p className="text-xs text-zinc-600 text-center py-2">No sector data yet</p>
          )}
        </div>

        <Separator className="my-4 bg-zinc-800" />

        <p className="text-xs font-medium text-zinc-400 mb-3">Jurisdictions</p>
        <div className="flex flex-wrap gap-1.5">
          {metrics?.topJurisdictions?.slice(0, 8).map((item: any, idx: number) => (
            <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
              {item.jurisdiction} ({item.count})
            </Badge>
          ))}
          {(!metrics?.topJurisdictions || metrics.topJurisdictions.length === 0) && (
            <p className="text-xs text-zinc-600">No jurisdiction data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PRIORITY TASKS WIDGET
// ============================================================================

function PriorityTasksWidget({ tasks }: { tasks: any[] }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            Priority Tasks
          </CardTitle>
          <Link href="/tasks">
            <span className="text-xs text-yellow-600 hover:text-yellow-500 cursor-pointer flex items-center gap-1">
              All Tasks <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task: any) => (
            <div key={task.id} className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <p className="text-sm text-white truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {task.category && (
                  <Badge variant="outline" className="border-yellow-600/30 text-yellow-600 text-[10px] px-1.5 py-0">{task.category}</Badge>
                )}
                {task.assignedName && (
                  <span className="text-[10px] text-zinc-500">{task.assignedName}</span>
                )}
                {task.dueDate && new Date(task.dueDate) < new Date() && (
                  <span className="text-[10px] text-red-500">Overdue</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// QUICK ACTIONS WIDGET
// ============================================================================

function QuickActionsWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Link href="/ask">
            <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30">
              <Sparkles className="h-4 w-4 mr-3 text-yellow-600" />
              Ask OmniScope
              <ArrowRight className="h-3 w-3 ml-auto text-zinc-600" />
            </Button>
          </Link>
          <Link href="/meetings">
            <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30">
              <FileText className="h-4 w-4 mr-3 text-yellow-600" />
              Browse Meetings
              <ArrowRight className="h-3 w-3 ml-auto text-zinc-600" />
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30">
              <CheckSquare className="h-4 w-4 mr-3 text-yellow-600" />
              Manage Tasks
              <ArrowRight className="h-3 w-3 ml-auto text-zinc-600" />
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30">
              <Calendar className="h-4 w-4 mr-3 text-yellow-600" />
              View Calendar
              <ArrowRight className="h-3 w-3 ml-auto text-zinc-600" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// METRIC CARD
// ============================================================================

function MetricCard({ title, value, sub, icon, accent, href }: {
  title: string; value: number; sub: string; icon: React.ReactNode; accent?: string; href?: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-yellow-600/20 transition-colors ${href ? 'cursor-pointer' : ''}`}
      onClick={href ? () => setLocation(href) : undefined}
    >
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
          <div className="text-yellow-600">{icon}</div>
        </div>
        <p className={`text-2xl font-bold ${accent === "red" ? "text-red-400" : "text-white"}`}>{value.toLocaleString()}</p>
        <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
