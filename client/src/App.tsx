import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PortalLayout from "./components/PortalLayout";
import Dashboard from "./pages/Dashboard";
import MeetingDetail from "./pages/MeetingDetail";
import Meetings from "./pages/Meetings";
import ToDo from "./pages/ToDo";
import AskOmniScope from "./pages/AskOmniScope";
import CalendarView from "./pages/CalendarView";
import AdminPanel from "./pages/AdminPanel";
import UserManagement from "./pages/UserManagement";
import AccessDenied from "./pages/AccessDenied";

function Router() {
  return (
    <PortalLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path="/meetings" component={Meetings} />
        <Route path="/meeting/:id" component={MeetingDetail} />
        <Route path="/tasks" component={ToDo} />
          <Route path="/ask" component={AskOmniScope} />
          <Route path="/calendar" component={CalendarView} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/admin/users" component={UserManagement} />
          <Route path="/access-denied" component={AccessDenied} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </PortalLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
