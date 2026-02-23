import DomainLayout from "@/components/DomainLayout";
import { Route, Switch } from "wouter";
import MailModule from "@/pages/MailModule";
import MailAnalytics from "@/pages/MailAnalytics";
import CalendarView from "@/pages/CalendarView";
import ChatModule from "@/pages/ChatModule";

const tabs = [
  { id: "chat", label: "Chat", path: "/chat" },
  { id: "inbox", label: "Inbox", path: "/communications", matchPaths: ["/communications", "/mail"] },
  { id: "calendar", label: "Calendar", path: "/calendar" },
  { id: "analytics", label: "Analytics", path: "/mail/analytics" },
];

export default function Communications() {
  return (
    <DomainLayout title="Communications" tabs={tabs}>
      <Switch>
        <Route path="/chat" component={ChatModule} />
        <Route path="/communications" component={MailModule} />
        <Route path="/mail" component={MailModule} />
        <Route path="/calendar" component={CalendarView} />
        <Route path="/mail/analytics" component={MailAnalytics} />
      </Switch>
    </DomainLayout>
  );
}
