import DomainLayout from "@/components/DomainLayout";
import { Route, Switch } from "wouter";
import Meetings from "@/pages/Meetings";
import MeetingDetail from "@/pages/MeetingDetail";

const tabs = [
  { id: "meetings", label: "Meetings", path: "/intelligence", matchPaths: ["/intelligence", "/meeting"] },
];

export default function Intelligence() {
  return (
    <DomainLayout title="Intelligence" tabs={tabs}>
      <Switch>
        <Route path="/intelligence" component={Meetings} />
        <Route path="/meeting/:id" component={MeetingDetail} />
      </Switch>
    </DomainLayout>
  );
}
