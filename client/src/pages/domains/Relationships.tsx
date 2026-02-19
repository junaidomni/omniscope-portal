import DomainLayout from "@/components/DomainLayout";
import { Route, Switch } from "wouter";
import Contacts from "@/pages/Contacts";
import ContactProfile from "@/pages/ContactProfile";
import Companies from "@/pages/Companies";
import CompanyProfile from "@/pages/CompanyProfile";

const tabs = [
  { id: "people", label: "People", path: "/relationships", matchPaths: ["/relationships", "/contacts", "/contact"] },
  { id: "companies", label: "Companies", path: "/companies", matchPaths: ["/companies", "/company"] },
];

export default function Relationships() {
  return (
    <DomainLayout title="Relationships" tabs={tabs}>
      <Switch>
        <Route path="/relationships" component={Contacts} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/contact/:id" component={ContactProfile} />
        <Route path="/companies" component={Companies} />
        <Route path="/company/:id" component={CompanyProfile} />
      </Switch>
    </DomainLayout>
  );
}
