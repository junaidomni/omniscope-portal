import DomainLayout from "@/components/DomainLayout";
import { Route, Switch } from "wouter";
import ToDo from "@/pages/ToDo";

const tabs = [
  { id: "tasks", label: "Tasks", path: "/operations", matchPaths: ["/operations", "/tasks"] },
];

export default function Operations() {
  return (
    <DomainLayout title="Operations" tabs={tabs}>
      <Switch>
        <Route path="/operations" component={ToDo} />
        <Route path="/tasks" component={ToDo} />
      </Switch>
    </DomainLayout>
  );
}
