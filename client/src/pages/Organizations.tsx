import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useOrg } from "@/contexts/OrgContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Building2,
  Plus,
  Settings,
  Users,
  Globe,
  Check,
  ChevronRight,
  Search,
  Crown,
  Shield,
  Eye,
  Briefcase,
  Clock,
  Palette,
  ArrowRight,
  Loader2,
  Key,
  Zap,
} from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  super_admin: { label: "Super Admin", icon: Crown, color: "#d4af37" },
  account_owner: { label: "Owner", icon: Crown, color: "#d4af37" },
  org_admin: { label: "Admin", icon: Shield, color: "#3b82f6" },
  manager: { label: "Manager", icon: Briefcase, color: "#10b981" },
  member: { label: "Member", icon: Users, color: "#8b5cf6" },
  viewer: { label: "Viewer", icon: Eye, color: "#6b7280" },
};

export default function Organizations() {
  const { user } = useAuth();
  const { memberships, currentOrg, switchOrg, account, isLoading } = useOrg();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Filter memberships by search
  const filtered = memberships.filter((m) =>
    m.org.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.org.industry || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.org.domain || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitchAndGo = (orgId: number) => {
    switchOrg(orgId);
    setLocation("/");
    toast.success("Switched workspace");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#d4af37" }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            Organizations
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.65 0 0)" }}>
            Manage your workspaces, teams, and configurations across all organizations.
          </p>
        </div>
        <Button
          onClick={() => setLocation("/org/new")}
          className="gap-2 shrink-0"
          style={{
            background: "linear-gradient(135deg, #d4af37, #b8962e)",
            color: "#000",
            border: "none",
          }}
        >
          <Plus className="h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Account Summary Card */}
      {account && (
        <Card
          className="overflow-hidden"
          style={{
            background: "oklch(0.16 0.005 80 / 0.6)",
            border: "1px solid oklch(0.3 0.02 80 / 0.3)",
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #d4af3722, #d4af3744)",
                    border: "1px solid #d4af3733",
                  }}
                >
                  <Crown className="h-5 w-5" style={{ color: "#d4af37" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                    {account.name}
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
                    {memberships.length} of {account.maxOrganizations} organizations used
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                  style={{
                    borderColor: "#d4af3744",
                    color: "#d4af37",
                    background: "#d4af3711",
                  }}
                >
                  {account.plan} Plan
                </Badge>
                <div className="h-2 w-32 rounded-full overflow-hidden" style={{ background: "oklch(0.25 0 0)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (memberships.length / account.maxOrganizations) * 100)}%`,
                      background: "linear-gradient(90deg, #d4af37, #f5d76e)",
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "oklch(0.5 0 0)" }} />
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          style={{
            background: "oklch(0.16 0 0 / 0.6)",
            border: "1px solid oklch(0.3 0 0 / 0.4)",
            color: "var(--color-foreground)",
          }}
        />
      </div>

      {/* Organizations Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: "oklch(0.4 0 0)" }} />
          <p className="text-sm" style={{ color: "oklch(0.55 0 0)" }}>
            {search ? "No organizations match your search." : "No organizations yet. Create your first workspace."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((m) => {
            const isCurrent = currentOrg?.id === m.org.id;
            const roleConfig = ROLE_CONFIG[m.role] || ROLE_CONFIG.member;
            const RoleIcon = roleConfig.icon;

            return (
              <Card
                key={m.org.id}
                className="group relative overflow-hidden transition-all duration-300 cursor-pointer"
                style={{
                  background: isCurrent
                    ? "oklch(0.16 0.01 80 / 0.8)"
                    : "oklch(0.14 0 0 / 0.6)",
                  border: isCurrent
                    ? "1px solid #d4af3744"
                    : "1px solid oklch(0.25 0 0 / 0.5)",
                }}
                onClick={() => setSelectedOrgId(selectedOrgId === m.org.id ? null : m.org.id)}
              >
                {/* Active indicator */}
                {isCurrent && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: "linear-gradient(90deg, #d4af37, #f5d76e)" }}
                  />
                )}

                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Org Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${m.org.accentColor || "#d4af37"}22, ${m.org.accentColor || "#d4af37"}44)`,
                        color: m.org.accentColor || "#d4af37",
                        border: `1px solid ${m.org.accentColor || "#d4af37"}33`,
                      }}
                    >
                      {m.org.logoUrl ? (
                        <img src={m.org.logoUrl} alt={m.org.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        m.org.name.split(/[\s-]+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                      )}
                    </div>

                    {/* Org Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                          {m.org.name}
                        </h3>
                        {isCurrent && (
                          <Badge
                            className="text-[10px] px-1.5 py-0 shrink-0"
                            style={{
                              background: "#d4af3722",
                              color: "#d4af37",
                              border: "1px solid #d4af3733",
                            }}
                          >
                            Active
                          </Badge>
                        )}
                      </div>

                      {/* Meta Row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: "oklch(0.55 0 0)" }}>
                          <RoleIcon className="h-3 w-3" style={{ color: roleConfig.color }} />
                          {roleConfig.label}
                        </span>
                        {m.org.industry && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "oklch(0.55 0 0)" }}>
                            <Briefcase className="h-3 w-3" />
                            {m.org.industry}
                          </span>
                        )}
                        {m.org.domain && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "oklch(0.55 0 0)" }}>
                            <Globe className="h-3 w-3" />
                            {m.org.domain}
                          </span>
                        )}
                        {m.org.timezone && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "oklch(0.55 0 0)" }}>
                            <Clock className="h-3 w-3" />
                            {m.org.timezone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <ChevronRight
                      className="h-4 w-4 shrink-0 transition-transform duration-200"
                      style={{
                        color: "oklch(0.45 0 0)",
                        transform: selectedOrgId === m.org.id ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  </div>

                  {/* Expanded Actions */}
                  {selectedOrgId === m.org.id && (
                    <div
                      className="mt-4 pt-4 flex flex-wrap gap-2"
                      style={{ borderTop: "1px solid oklch(0.25 0 0 / 0.5)" }}
                    >
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          style={{
                            borderColor: "#d4af3744",
                            color: "#d4af37",
                            background: "transparent",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchAndGo(m.org.id);
                          }}
                        >
                          <ArrowRight className="h-3 w-3" />
                          Switch to this workspace
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        style={{
                          borderColor: "oklch(0.3 0 0 / 0.5)",
                          color: "oklch(0.7 0 0)",
                          background: "transparent",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toast("Org settings coming soon", { description: "This feature is under development." });
                        }}
                      >
                        <Settings className="h-3 w-3" />
                        Settings
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        style={{
                          borderColor: "oklch(0.3 0 0 / 0.5)",
                          color: "oklch(0.7 0 0)",
                          background: "transparent",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toast("Team management coming soon", { description: "This feature is under development." });
                        }}
                      >
                        <Users className="h-3 w-3" />
                        Members
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        style={{
                          borderColor: "oklch(0.3 0 0 / 0.5)",
                          color: "oklch(0.7 0 0)",
                          background: "transparent",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toast("API keys coming soon", { description: "This feature is under development." });
                        }}
                      >
                        <Key className="h-3 w-3" />
                        API Keys
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions Footer */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "oklch(0.14 0.005 80 / 0.4)",
          border: "1px solid oklch(0.25 0.01 80 / 0.3)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Zap className="h-4 w-4" style={{ color: "#d4af37" }} />
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: "oklch(0.55 0 0)" }}>
            Quick Actions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            style={{
              borderColor: "oklch(0.3 0 0 / 0.5)",
              color: "oklch(0.7 0 0)",
              background: "transparent",
            }}
            onClick={() => setLocation("/org/new")}
          >
            <Plus className="h-3 w-3" />
            Create Organization
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            style={{
              borderColor: "oklch(0.3 0 0 / 0.5)",
              color: "oklch(0.7 0 0)",
              background: "transparent",
            }}
            onClick={() => setLocation("/setup")}
          >
            <Settings className="h-3 w-3" />
            Platform Settings
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            style={{
              borderColor: "oklch(0.3 0 0 / 0.5)",
              color: "oklch(0.7 0 0)",
              background: "transparent",
            }}
            onClick={() => setLocation("/setup?tab=integrations")}
          >
            <Globe className="h-3 w-3" />
            Integrations
          </Button>
        </div>
      </div>
    </div>
  );
}
