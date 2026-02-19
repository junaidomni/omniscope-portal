import DomainLayout from "@/components/DomainLayout";
import { Route, Switch, Redirect } from "wouter";
import Dashboard from "@/pages/Dashboard";
import DailyReport from "@/pages/DailyReport";
import WeeklyReport from "@/pages/WeeklyReport";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const TriageFeed = lazy(() => import("@/pages/TriageFeed"));

const tabs = [
  { id: "triage", label: "Triage", path: "/" },
  { id: "overview", label: "Overview", path: "/overview" },
  { id: "daily", label: "Daily Brief", path: "/reports/daily" },
  { id: "weekly", label: "Weekly Brief", path: "/reports/weekly" },
];

export default function CommandCenter() {
  return (
    <DomainLayout title="Command Center" tabs={tabs}>
      <Switch>
        <Route path="/" component={() => (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-yellow-600" /></div>}>
            <TriageFeed />
          </Suspense>
        )} />
        <Route path="/overview" component={Dashboard} />
        <Route path="/reports/daily" component={DailyReport} />
        <Route path="/reports/weekly" component={WeeklyReport} />
      </Switch>
    </DomainLayout>
  );
}
