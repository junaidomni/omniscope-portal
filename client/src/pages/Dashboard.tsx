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
  BarChart3, GripVertical, RotateCcw, Move, X
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// ============================================================================
// TIMEZONE CLOCKS
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
      <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{city}</p>
      <p className="text-sm font-semibold text-zinc-200 tabular-nums">{time}</p>
    </div>
  );
}

function LocalClock() {
  const [time, setTime] = useState("");
  const [info, setInfo] = useState({ city: "Local", tz: "" });

  useEffect(() => {
    // Detect user's timezone and resolve city name
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "America/New_York"
    const city = userTz.split("/").pop()?.replace(/_/g, " ") || "Local";
    const abbr = new Date().toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop() || "";
    setInfo({ city, tz: abbr });

    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center flex-shrink-0 pl-2">
      <p className="text-[10px] text-yellow-600 font-semibold uppercase tracking-wider">
        {info.city} ({info.tz})
      </p>
      <p className="text-base font-bold text-yellow-500 tabular-nums">{time}</p>
    </div>
  );
}

// ============================================================================
// LAYOUT SYSTEM - Widget ordering with drag-and-drop
// ============================================================================

const DEFAULT_WIDGET_ORDER = [
  "daily-report",
  "weekly-report",
  "upcoming-schedule",
  "recent-intelligence",
  "priority-tasks",
  "active-verticals",
  "quick-actions",
];

const WIDGET_LABELS: Record<string, string> = {
  "daily-report": "Daily Report",
  "weekly-report": "Weekly Report",
  "upcoming-schedule": "Upcoming Schedule",
  "recent-intelligence": "Recent Intelligence",
  "priority-tasks": "Priority Tasks",
  "active-verticals": "Active Verticals",
  "quick-actions": "Quick Actions",
};

const STORAGE_KEY = "omniscope-dashboard-layout-v3";

function useDashboardLayout() {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all default widgets are included
        const allWidgets = [...parsed.filter((id: string) => DEFAULT_WIDGET_ORDER.includes(id))];
        DEFAULT_WIDGET_ORDER.forEach(id => {
          if (!allWidgets.includes(id)) allWidgets.push(id);
        });
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

  // Drag state for widget reordering
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

  // Auto-sync: Fathom meetings + Google Calendar on page load
  const fathomSync = trpc.ingestion.syncFathom.useMutation();
  const utils = trpc.useUtils();
  const fathomSyncedRef = useRef(false);

  useEffect(() => {
    // Sync Fathom meetings (once per page load)
    if (!fathomSyncedRef.current) {
      fathomSyncedRef.current = true;
      fathomSync.mutateAsync().then((result) => {
        if (result.imported > 0) {
          toast.success(`${result.imported} new meeting(s) synced from Fathom`);
          utils.meetings.list.invalidate();
          utils.analytics.dashboard.invalidate();
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const syncAndFetch = async () => {
      try {
        // Sync from Google Calendar (silent)
        await fetch('/api/calendar/sync', { method: 'POST' }).catch(() => {});
      } catch {}
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
    syncAndFetch();
  }, []);

  const parseMeetingParticipants = (m: any) => {
    try { return JSON.parse(m.participants || "[]"); } catch { return []; }
  };

  const urgentTasks = useMemo(() => {
    return allTasks
      .filter((t: any) => t.priority === "high" || (t.dueDate && new Date(t.dueDate) < new Date()))
      .slice(0, 5);
  }, [allTasks]);

  // ========== DRAG AND DROP HANDLERS ==========
  const onDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const onDragEnter = (widgetId: string) => {
    if (draggedWidget && draggedWidget !== widgetId) {
      setDragOverWidget(widgetId);
    }
  };

  const onDragEnd = () => {
    if (draggedWidget && dragOverWidget && draggedWidget !== dragOverWidget) {
      const newOrder = [...widgetOrder];
      const fromIdx = newOrder.indexOf(draggedWidget);
      const toIdx = newOrder.indexOf(dragOverWidget);
      if (fromIdx !== -1 && toIdx !== -1) {
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, draggedWidget);
        saveOrder(newOrder);
        toast.success("Widget moved");
      }
    }
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  // Widget content renderer
  const getWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case "daily-report":
        return <DailyReportWidget />;
      case "weekly-report":
        return <WeeklyReportWidget />;
      case "upcoming-schedule":
        return <UpcomingScheduleWidget events={upcomingEvents} loading={eventsLoading} />;
      case "recent-intelligence":
        return <RecentIntelligenceWidget meetings={allMeetings} parseMeetingParticipants={parseMeetingParticipants} />;
      case "priority-tasks":
        return <PriorityTasksWidget tasks={urgentTasks} />;
      case "active-verticals":
        return <ActiveVerticalsWidget metrics={metrics} />;
      case "quick-actions":
        return <QuickActionsWidget />;
      default:
        return null;
    }
  };

  // Determine grid span for each widget
  const getWidgetSpan = (widgetId: string): string => {
    switch (widgetId) {
      case "daily-report":
      case "weekly-report":
        return "col-span-1"; // half width in 2-col grid
      case "upcoming-schedule":
      case "recent-intelligence":
      case "priority-tasks":
        return "col-span-1"; // one third in 3-col grid
      case "active-verticals":
      case "quick-actions":
        return "col-span-1";
      default:
        return "col-span-1";
    }
  };

  if (metricsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-4 w-20 bg-zinc-800 mb-3" />
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Split widgets into report row and main grid
  const reportWidgets = widgetOrder.filter(id => id === "daily-report" || id === "weekly-report");
  const mainWidgets = widgetOrder.filter(id => id !== "daily-report" && id !== "weekly-report");

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
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white" onClick={resetOrder}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
                </Button>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-500 text-black font-medium" onClick={() => { setIsCustomizing(false); toast.success("Layout saved"); }}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white" onClick={() => setIsCustomizing(true)}>
                  <GripVertical className="h-4 w-4 mr-1.5" /> Customize
                </Button>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white" onClick={handleExportDailyBrief} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-1.5" /> {isExporting ? "Exporting..." : "Export Brief"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Timezone Strip */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-zinc-900/30 rounded-lg border border-zinc-800/50 overflow-x-auto">
          <Globe className="h-4 w-4 text-zinc-600 flex-shrink-0" />
          {TIMEZONES.map((tz, idx) => (
            <div key={tz.zone} className="flex items-center gap-4">
              <MiniClock zone={tz.zone} city={tz.city} />
              {idx < TIMEZONES.length - 1 && <Separator orientation="vertical" className="h-6 bg-zinc-800" />}
            </div>
          ))}
          <div className="flex-1" />
          <Separator orientation="vertical" className="h-6 bg-zinc-700" />
          <LocalClock />
        </div>
      </div>

      {/* Customization Banner */}
      {isCustomizing && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-600/10 border border-yellow-600/30 flex items-center gap-2">
          <Move className="h-4 w-4 text-yellow-500" />
          <p className="text-sm text-yellow-500 font-medium">Drag widgets to rearrange your dashboard layout</p>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Today" value={metrics?.meetingsToday || 0} sub={`${metrics?.meetingsThisWeek || 0} this week`} icon={<Calendar className="h-4 w-4" />} href="/calendar" />
        <MetricCard title="Contacts" value={metrics?.uniqueParticipants || 0} sub={`${metrics?.uniqueOrganizations || 0} orgs`} icon={<Users className="h-4 w-4" />} href="/meetings?tab=people" />
        <MetricCard title="Open Tasks" value={metrics?.openTasks || 0} sub={`${metrics?.completedTasksToday || 0} done today`} icon={<CheckSquare className="h-4 w-4" />} accent={metrics?.openTasks && metrics.openTasks > 10 ? "red" : undefined} href="/tasks" />
        <MetricCard title="Total Intel" value={metrics?.totalMeetings || 0} sub={`${metrics?.meetingsThisMonth || 0} this month`} icon={<TrendingUp className="h-4 w-4" />} href="/meetings" />
      </div>

      {/* Report Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {reportWidgets.map(id => (
          <DraggableWidget
            key={id}
            widgetId={id}
            isCustomizing={isCustomizing}
            isDragging={draggedWidget === id}
            isDragOver={dragOverWidget === id}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
          >
            {getWidgetContent(id)}
          </DraggableWidget>
        ))}
      </div>

      {/* Main Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mainWidgets.map(id => (
          <DraggableWidget
            key={id}
            widgetId={id}
            isCustomizing={isCustomizing}
            isDragging={draggedWidget === id}
            isDragOver={dragOverWidget === id}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
          >
            {getWidgetContent(id)}
          </DraggableWidget>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DRAGGABLE WIDGET WRAPPER
// ============================================================================

function DraggableWidget({
  widgetId,
  isCustomizing,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
  children,
}: {
  widgetId: string;
  isCustomizing: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable={isCustomizing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", widgetId);
        onDragStart(widgetId);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter(widgetId);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd();
      }}
      onDragEnd={onDragEnd}
      className={`relative transition-all duration-200 ${
        isCustomizing ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-30 scale-95" : ""} ${
        isDragOver ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-black rounded-xl scale-[1.02]" : ""
      }`}
    >
      {isCustomizing && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-600 text-black text-xs font-semibold shadow-lg">
          <GripVertical className="h-3.5 w-3.5" />
          {WIDGET_LABELS[widgetId] || widgetId}
        </div>
      )}
      {children}
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
      <Card className="bg-gradient-to-br from-yellow-600/8 to-zinc-900/50 border-yellow-600/20 hover:border-yellow-600/40 transition-all cursor-pointer group h-full">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Daily Report</p>
                <p className="text-xs text-zinc-500">Today's intelligence summary</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-lg bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.meetingCount}</p>
                <p className="text-[11px] text-zinc-500">Meetings</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.tasksCreated}</p>
                <p className="text-[11px] text-zinc-500">Tasks</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.meetings?.reduce((acc: number, m: any) => acc + (m.participants?.length || 0), 0) ?? 0}</p>
                <p className="text-[11px] text-zinc-500">Contacts</p>
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
      <Card className="bg-gradient-to-br from-yellow-600/8 to-zinc-900/50 border-yellow-600/20 hover:border-yellow-600/40 transition-all cursor-pointer group h-full">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Weekly Report</p>
                <p className="text-xs text-zinc-500">Full week intelligence</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-lg bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.meetingCount}</p>
                <p className="text-[11px] text-zinc-500">Meetings</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.tasksCreated}</p>
                <p className="text-[11px] text-zinc-500">Tasks</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-zinc-900/50">
                <p className="text-lg font-bold text-white">{summary.uniqueParticipants}</p>
                <p className="text-[11px] text-zinc-500">Contacts</p>
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
    <Card className="bg-zinc-900/50 border-zinc-800 h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-200">Upcoming Schedule</CardTitle>
          <Link href="/calendar">
            <span className="text-xs text-yellow-600 hover:text-yellow-500 cursor-pointer flex items-center gap-1">
              View Calendar <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 bg-zinc-800 rounded-lg" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map(event => {
              const startDate = new Date(event.start);
              const isToday = startDate.toDateString() === new Date().toDateString();
              const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

              return (
                <div key={event.id} className={`p-3 rounded-lg border transition-all ${isToday ? 'bg-yellow-600/5 border-yellow-600/20' : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.summary}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        <span>{dayLabel}</span>
                        {!event.isAllDay && (
                          <span>{startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </div>
                    {event.hangoutLink && (
                      <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-500 ml-2" onClick={e => e.stopPropagation()}>
                        <Video className="h-4 w-4" />
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
    <Card className="bg-zinc-900/50 border-zinc-800 h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-200">Recent Intelligence</CardTitle>
          <Link href="/meetings">
            <span className="text-xs text-yellow-600 hover:text-yellow-500 cursor-pointer flex items-center gap-1">
              All Meetings <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {meetings.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-500">No meetings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.slice(0, 5).map((meeting: any) => {
              const participants = parseMeetingParticipants(meeting);
              return (
                <Link key={meeting.id} href={`/meeting/${meeting.id}`}>
                  <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800 hover:border-yellow-600/20 transition-all cursor-pointer">
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
                      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[11px] px-1.5 py-0 ml-2 flex-shrink-0">
                        {meeting.sourceType}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-1.5">{meeting.executiveSummary}</p>
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
    <Card className="bg-zinc-900/50 border-zinc-800 h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-zinc-200">Active Verticals</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {metrics?.topSectors?.slice(0, 5).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">{item.sector}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 bg-zinc-800 rounded-full overflow-hidden">
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

        <Separator className="my-3 bg-zinc-800" />

        <p className="text-xs font-medium text-zinc-400 mb-2">Jurisdictions</p>
        <div className="flex flex-wrap gap-1.5">
          {metrics?.topJurisdictions?.slice(0, 8).map((item: any, idx: number) => (
            <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-400 text-[11px] px-2 py-0.5">
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
    <Card className="bg-zinc-900/50 border-zinc-800 h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Priority Tasks
          </CardTitle>
          <Link href="/tasks">
            <span className="text-xs text-yellow-600 hover:text-yellow-500 cursor-pointer flex items-center gap-1">
              All Tasks <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-500">No priority tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task: any) => (
              <div key={task.id} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                <p className="text-sm text-white truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {task.category && (
                    <Badge variant="outline" className="border-yellow-600/30 text-yellow-600 text-[11px] px-1.5 py-0">{task.category}</Badge>
                  )}
                  {task.assignedName && (
                    <span className="text-[11px] text-zinc-500">{task.assignedName}</span>
                  )}
                  {task.dueDate && new Date(task.dueDate) < new Date() && (
                    <span className="text-[11px] text-red-500 font-medium">Overdue</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// QUICK ACTIONS WIDGET
// ============================================================================

function QuickActionsWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-zinc-200">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          <Link href="/ask">
            <Button variant="outline" size="sm" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30 h-10 text-sm">
              <Sparkles className="h-4 w-4 mr-2.5 text-yellow-600" />
              Ask OmniScope
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-zinc-600" />
            </Button>
          </Link>
          <Link href="/meetings">
            <Button variant="outline" size="sm" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30 h-10 text-sm">
              <FileText className="h-4 w-4 mr-2.5 text-yellow-600" />
              Browse Meetings
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-zinc-600" />
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" size="sm" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30 h-10 text-sm">
              <CheckSquare className="h-4 w-4 mr-2.5 text-yellow-600" />
              Manage Tasks
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-zinc-600" />
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" size="sm" className="w-full justify-start border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/30 h-10 text-sm">
              <Calendar className="h-4 w-4 mr-2.5 text-yellow-600" />
              View Calendar
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-zinc-600" />
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
      <CardContent className="pt-4 pb-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
          <div className="text-yellow-600">{icon}</div>
        </div>
        <p className={`text-2xl font-bold ${accent === "red" ? "text-red-400" : "text-white"}`}>{value.toLocaleString()}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
