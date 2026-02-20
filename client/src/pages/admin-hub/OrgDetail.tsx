/**
 * Admin Hub — Organization Detail / Settings
 * Full org management: rename, branding, timezone, members, API keys.
 * Apple/Tesla design: minimal, precise, generous whitespace.
 */
import { trpc } from "@/lib/trpc";
import { useDesign } from "@/components/PortalLayout";
import { useOrg } from "@/contexts/OrgContext";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Users, Key, Palette, Globe, Clock,
  Save, Pencil, Trash2, Shield, ChevronDown, ExternalLink,
  Copy, Eye, EyeOff, BarChart3, CheckCircle2, XCircle,
  MoreHorizontal, Upload, ImagePlus,
} from "lucide-react";

type TabId = "general" | "members" | "integrations" | "branding";

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "members", label: "Members", icon: Users },
  { id: "integrations", label: "Integrations & API Keys", icon: Key },
  { id: "branding", label: "Branding", icon: Palette },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  account_owner: "Account Owner",
  org_admin: "Org Admin",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#a855f7",
  account_owner: "#d4af37",
  org_admin: "#3b82f6",
  manager: "#10b981",
  member: "#64748b",
  viewer: "#94a3b8",
};

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Dubai", "Asia/Karachi", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland",
];

export default function OrgDetail() {
  const [, params] = useRoute("/admin-hub/org/:id");
  const [, navigate] = useLocation();
  const orgId = params?.id ? parseInt(params.id) : null;

  const { data: org, isLoading, refetch } = trpc.adminHub.getOrgDetail.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const updateOrg = trpc.adminHub.updateOrg.useMutation({
    onSuccess: () => { refetch(); toast.success("Organization updated"); },
    onError: (err) => toast.error(err.message || "Failed to update"),
  });

  const updateMemberRole = trpc.adminHub.updateMemberRole.useMutation({
    onSuccess: () => { refetch(); toast.success("Member role updated"); },
    onError: (err) => toast.error(err.message || "Failed to update role"),
  });

  const removeMember = trpc.adminHub.removeMember.useMutation({
    onSuccess: () => { refetch(); toast.success("Member removed"); },
    onError: (err) => toast.error(err.message || "Failed to remove member"),
  });

  const updateIntegration = trpc.adminHub.updateIntegration.useMutation({
    onSuccess: () => { refetch(); toast.success("Integration updated"); },
    onError: (err) => toast.error(err.message || "Failed to update integration"),
  });

  const { switchOrg } = useOrg();
  const { accentColor, isLightTheme } = useDesign();
  const [activeTab, setActiveTab] = useState<TabId>("general");

  // Design tokens
  const cardBg = isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.03)";
  const cardBorder = isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const textPrimary = isLightTheme ? "oklch(0.15 0 0)" : "oklch(0.92 0.02 85)";
  const textSecondary = isLightTheme ? "oklch(0.40 0 0)" : "oklch(0.60 0.02 0)";
  const textMuted = isLightTheme ? "oklch(0.55 0 0)" : "oklch(0.48 0.01 0)";
  const inputBg = isLightTheme ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";
  const hoverBg = isLightTheme ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";

  if (!orgId) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p style={{ color: textMuted }}>Invalid organization ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: cardBg }} />
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: cardBg }} />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
        <Building2 className="h-12 w-12" style={{ color: textMuted }} />
        <p style={{ color: textSecondary }}>Organization not found</p>
        <button
          onClick={() => navigate("/admin-hub/organizations")}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          Back to Organizations
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin-hub/organizations")}
            className="p-2 rounded-xl transition-all duration-200"
            style={{ color: textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: `${org.accentColor || accentColor}20`, color: org.accentColor || accentColor }}
                >
                  {org.name.split(/[\s-]+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: textPrimary }}>
                  {org.name}
                </h1>
                <p className="text-xs" style={{ color: textMuted }}>/{org.slug}</p>
              </div>
              <div
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  background: org.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  color: org.status === "active" ? "#10b981" : "#ef4444",
                }}
              >
                {org.status}
              </div>
            </div>
          </div>
          <button
            onClick={() => { switchOrg(org.id); window.location.href = "/"; }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}20` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${accentColor}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${accentColor}10`; }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Enter Workspace
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Members", value: org.stats.members, icon: Users },
            { label: "Meetings", value: org.stats.meetings, icon: BarChart3 },
            { label: "Tasks", value: org.stats.tasks, icon: CheckCircle2 },
            { label: "Contacts", value: org.stats.contacts, icon: Globe },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <stat.icon className="h-4 w-4 mb-2" style={{ color: accentColor }} />
              <p className="text-xl font-bold" style={{ color: textPrimary }}>{stat.value}</p>
              <p className="text-xs" style={{ color: textMuted }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: inputBg }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center"
              style={{
                background: activeTab === tab.id ? cardBg : "transparent",
                color: activeTab === tab.id ? textPrimary : textMuted,
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "general" && <GeneralTab org={org} updateOrg={updateOrg} tokens={{ cardBg, cardBorder, textPrimary, textSecondary, textMuted, inputBg, accentColor, isLightTheme }} />}
        {activeTab === "members" && <MembersTab org={org} updateMemberRole={updateMemberRole} removeMember={removeMember} tokens={{ cardBg, cardBorder, textPrimary, textSecondary, textMuted, inputBg, accentColor, isLightTheme, hoverBg }} />}
        {activeTab === "integrations" && <IntegrationsTab org={org} updateIntegration={updateIntegration} tokens={{ cardBg, cardBorder, textPrimary, textSecondary, textMuted, inputBg, accentColor, isLightTheme }} />}
        {activeTab === "branding" && <BrandingTab org={org} updateOrg={updateOrg} tokens={{ cardBg, cardBorder, textPrimary, textSecondary, textMuted, inputBg, accentColor, isLightTheme }} />}
      </div>
    </div>
  );
}

/* ─── General Tab ─── */
function GeneralTab({ org, updateOrg, tokens }: any) {
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [industry, setIndustry] = useState(org.industry || "");
  const [domain, setDomain] = useState(org.domain || "");
  const [timezone, setTimezone] = useState(org.timezone || "America/New_York");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(org.name);
    setSlug(org.slug);
    setIndustry(org.industry || "");
    setDomain(org.domain || "");
    setTimezone(org.timezone || "America/New_York");
  }, [org]);

  const hasChanges = name !== org.name || slug !== org.slug || industry !== (org.industry || "") || domain !== (org.domain || "") || timezone !== (org.timezone || "America/New_York");

  const handleSave = () => {
    const updates: any = { orgId: org.id };
    if (name !== org.name) updates.name = name;
    if (slug !== org.slug) updates.slug = slug;
    if (industry !== (org.industry || "")) updates.industry = industry || null;
    if (domain !== (org.domain || "")) updates.domain = domain || null;
    if (timezone !== (org.timezone || "America/New_York")) updates.timezone = timezone;
    updateOrg.mutate(updates);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Organization Name — prominent editable field */}
      <div className="rounded-2xl p-6" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: tokens.textMuted, letterSpacing: "0.08em" }}>
            Organization Details
          </h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: `${tokens.accentColor}10`, color: tokens.accentColor }}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditing(false); setName(org.name); setSlug(org.slug); setIndustry(org.industry || ""); setDomain(org.domain || ""); setTimezone(org.timezone || "America/New_York"); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ color: tokens.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || updateOrg.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: hasChanges ? tokens.accentColor : `${tokens.accentColor}30`,
                  color: tokens.isLightTheme ? "#fff" : "#000",
                  opacity: hasChanges ? 1 : 0.5,
                }}
              >
                <Save className="h-3 w-3" />
                {updateOrg.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              Organization Name
            </label>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
              />
            ) : (
              <p className="text-sm font-medium py-2.5" style={{ color: tokens.textPrimary }}>{org.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              URL Slug
            </label>
            {editing ? (
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
              />
            ) : (
              <p className="text-sm font-mono py-2.5" style={{ color: tokens.textMuted }}>/{org.slug}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              Industry
            </label>
            {editing ? (
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Financial Services"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
              />
            ) : (
              <p className="text-sm py-2.5" style={{ color: org.industry ? tokens.textPrimary : tokens.textMuted }}>
                {org.industry || "Not set"}
              </p>
            )}
          </div>

          {/* Domain */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              Domain
            </label>
            {editing ? (
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., omniscopex.ae"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
              />
            ) : (
              <p className="text-sm py-2.5" style={{ color: org.domain ? tokens.textPrimary : tokens.textMuted }}>
                {org.domain || "Not set"}
              </p>
            )}
          </div>

          {/* Timezone */}
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              <Clock className="h-3 w-3 inline mr-1" />
              Timezone
            </label>
            {editing ? (
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm py-2.5 flex items-center gap-1.5" style={{ color: tokens.textPrimary }}>
                <Globe className="h-3.5 w-3.5" style={{ color: tokens.accentColor }} />
                {org.timezone || "America/New_York"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Created / Updated */}
      <div className="rounded-2xl p-5" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs" style={{ color: tokens.textMuted }}>Created</p>
            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              {new Date(org.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: tokens.textMuted }}>Last Updated</p>
            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              {new Date(org.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: tokens.textMuted }}>Onboarding</p>
            <p className="text-sm font-medium flex items-center gap-1" style={{ color: org.onboardingCompleted ? "#10b981" : "#f59e0b" }}>
              {org.onboardingCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {org.onboardingCompleted ? "Complete" : "Pending"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Members Tab ─── */
function MembersTab({ org, updateMemberRole, removeMember, tokens }: any) {
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
            Team Members ({org.members.length})
          </h3>
          <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
            Manage roles and access for this organization.
          </p>
        </div>
      </div>

      {org.members.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
          <Users className="h-10 w-10 mx-auto mb-3" style={{ color: tokens.textMuted }} />
          <p className="text-sm" style={{ color: tokens.textSecondary }}>No members in this organization.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {org.members.map((member: any) => (
            <div
              key={member.id}
              className="rounded-2xl p-4 transition-all duration-200"
              style={{ background: tokens.cardBg, border: `1px solid ${expandedMember === member.id ? `${tokens.accentColor}33` : tokens.cardBorder}` }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                  style={{ background: `${ROLE_COLORS[member.role] || tokens.accentColor}20`, color: ROLE_COLORS[member.role] || tokens.accentColor }}
                >
                  {(member.userName || "?").charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: tokens.textPrimary }}>
                    {member.userName || "Unknown"}
                  </p>
                  <p className="text-xs truncate" style={{ color: tokens.textMuted }}>
                    {member.userEmail}
                  </p>
                </div>

                {/* Role Badge */}
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0"
                  style={{ background: `${ROLE_COLORS[member.role] || tokens.accentColor}15`, color: ROLE_COLORS[member.role] || tokens.accentColor }}
                >
                  {ROLE_LABELS[member.role] || member.role}
                </span>

                {/* Joined */}
                <span className="text-xs shrink-0" style={{ color: tokens.textMuted }}>
                  {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                {/* Expand */}
                <button
                  onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                  className="p-1.5 rounded-lg transition-all duration-200 shrink-0"
                  style={{ color: tokens.textMuted }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = tokens.hoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded Actions */}
              {expandedMember === member.id && (
                <div className="mt-4 pt-4 flex items-center gap-3 flex-wrap" style={{ borderTop: `1px solid ${tokens.cardBorder}` }}>
                  <span className="text-xs font-medium" style={{ color: tokens.textMuted }}>Change role:</span>
                  {(["org_admin", "manager", "member", "viewer"] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => updateMemberRole.mutate({ membershipId: member.id, role })}
                      disabled={member.role === role || updateMemberRole.isPending}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                      style={{
                        background: member.role === role ? `${ROLE_COLORS[role]}20` : tokens.inputBg,
                        color: member.role === role ? ROLE_COLORS[role] : tokens.textSecondary,
                        border: `1px solid ${member.role === role ? `${ROLE_COLORS[role]}30` : tokens.cardBorder}`,
                        opacity: member.role === role ? 0.6 : 1,
                      }}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.userName} from this organization?`)) {
                        removeMember.mutate({ membershipId: member.id });
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Integrations Tab ─── */
function IntegrationsTab({ org, updateIntegration, tokens }: any) {
  const [expandedInt, setExpandedInt] = useState<number | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState<Record<number, boolean>>({});

  const allIntegrations = trpc.adminHub.listAllIntegrations.useQuery();
  const platformIntegrations = allIntegrations.data ?? [];

  // Merge: show platform integrations with org-specific overrides
  const mergedIntegrations = useMemo(() => {
    const orgIntMap = new Map((org.integrations || []).map((i: any) => [i.slug, i]));
    return platformIntegrations.map((pi: any) => ({
      ...pi,
      orgOverride: orgIntMap.get(pi.slug) || null,
    }));
  }, [platformIntegrations, org.integrations]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
          Integrations & API Keys
        </h3>
        <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
          Configure API keys and integration settings for this organization.
        </p>
      </div>

      {mergedIntegrations.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
          <Key className="h-10 w-10 mx-auto mb-3" style={{ color: tokens.textMuted }} />
          <p className="text-sm" style={{ color: tokens.textSecondary }}>No integrations configured yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mergedIntegrations.map((integration: any) => (
            <IntegrationRow
              key={integration.id}
              integration={integration}
              expanded={expandedInt === integration.id}
              onToggleExpand={() => setExpandedInt(expandedInt === integration.id ? null : integration.id)}
              apiKeyVisible={apiKeyVisible[integration.id] || false}
              onToggleApiKeyVisible={() => setApiKeyVisible((prev) => ({ ...prev, [integration.id]: !prev[integration.id] }))}
              updateIntegration={updateIntegration}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IntegrationRow({ integration, expanded, onToggleExpand, apiKeyVisible, onToggleApiKeyVisible, updateIntegration, tokens }: any) {
  const [apiKey, setApiKey] = useState(integration.apiKey || "");
  const [baseUrl, setBaseUrl] = useState(integration.baseUrl || "");

  const statusColor = {
    connected: "#10b981",
    disconnected: "#64748b",
    error: "#ef4444",
    pending: "#f59e0b",
  }[integration.status as string] || "#64748b";

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{ background: tokens.cardBg, border: `1px solid ${expanded ? `${tokens.accentColor}33` : tokens.cardBorder}` }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        {integration.iconUrl ? (
          <img src={integration.iconUrl} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0" />
        ) : (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
            style={{ background: `${integration.iconColor || tokens.accentColor}20`, color: integration.iconColor || tokens.accentColor }}
          >
            {integration.iconLetter || integration.name.charAt(0)}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>{integration.name}</p>
          <p className="text-xs" style={{ color: tokens.textMuted }}>{integration.category} · {integration.type}</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span className="text-xs font-medium" style={{ color: statusColor }}>
            {integration.status}
          </span>
        </div>

        {/* Toggle */}
        <button
          onClick={() => updateIntegration.mutate({ integrationId: integration.id, enabled: !integration.enabled })}
          className="relative w-10 h-5 rounded-full transition-all duration-300 shrink-0"
          style={{ background: integration.enabled ? tokens.accentColor : (tokens.isLightTheme ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)") }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm"
            style={{ left: integration.enabled ? "22px" : "2px", background: tokens.isLightTheme ? "#fff" : "#1a1a1a" }}
          />
        </button>

        {/* Expand */}
        <button
          onClick={onToggleExpand}
          className="p-1.5 rounded-lg transition-all duration-200 shrink-0"
          style={{ color: tokens.textMuted }}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expanded: API Key Config */}
      {expanded && (
        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${tokens.cardBorder}` }}>
          {/* API Key */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={apiKeyVisible ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
                className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
              />
              <button
                onClick={onToggleApiKeyVisible}
                className="p-2 rounded-lg"
                style={{ color: tokens.textMuted }}
              >
                {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied to clipboard"); }}
                className="p-2 rounded-lg"
                style={{ color: tokens.textMuted }}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: tokens.textSecondary }}>
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200"
              style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                updateIntegration.mutate({
                  integrationId: integration.id,
                  apiKey: apiKey || null,
                  baseUrl: baseUrl || null,
                });
              }}
              disabled={updateIntegration.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: tokens.accentColor, color: tokens.isLightTheme ? "#fff" : "#000" }}
            >
              <Save className="h-3 w-3" />
              {updateIntegration.isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Branding Tab ─── */
function BrandingTab({ org, updateOrg, tokens }: any) {
  const [logoUrl, setLogoUrl] = useState(org.logoUrl || "");
  const [accentColor, setAccentColor] = useState(org.accentColor || "#d4af37");
  const [uploading, setUploading] = useState(false);

  const uploadLogo = trpc.adminHub.uploadOrgLogo.useMutation({
    onSuccess: (data: any) => {
      setLogoUrl(data.url);
      toast.success("Logo uploaded");
    },
    onError: (err: any) => toast.error(err.message || "Upload failed"),
  });

  useEffect(() => {
    setLogoUrl(org.logoUrl || "");
    setAccentColor(org.accentColor || "#d4af37");
  }, [org]);

  const hasChanges = logoUrl !== (org.logoUrl || "") || accentColor !== (org.accentColor || "#d4af37");

  const presetColors = [
    "#d4af37", "#10b981", "#3b82f6", "#a855f7", "#ef4444",
    "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#64748b",
  ];

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/svg+xml,image/webp";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
      setUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadLogo.mutate(
          { orgId: org.id, base64, mimeType: file.type },
          { onSettled: () => setUploading(false) }
        );
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    updateOrg.mutate({ orgId: org.id, logoUrl: null });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-6" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
        <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: tokens.textMuted, letterSpacing: "0.08em" }}>
          Brand Identity
        </h3>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="text-xs font-medium mb-3 block" style={{ color: tokens.textSecondary }}>
            Organization Logo
          </label>
          <div className="flex items-start gap-5">
            {/* Logo Preview */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden relative group cursor-pointer"
              style={{ background: tokens.inputBg, border: `2px dashed ${tokens.cardBorder}` }}
              onClick={handleFileUpload}
            >
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                    <div className="p-1.5 rounded-lg bg-white/10">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="h-6 w-6" style={{ color: tokens.textMuted }} />
                  <span className="text-[9px]" style={{ color: tokens.textMuted }}>Upload</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{ background: `${tokens.accentColor}18`, color: tokens.accentColor, border: `1px solid ${tokens.accentColor}30` }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload Logo"}
                </button>
                {logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[10px]" style={{ color: tokens.textMuted }}>
                Drag & drop or click to upload. PNG, SVG, JPEG, or WebP. Max 5MB.
              </p>
              <p className="text-[10px]" style={{ color: tokens.textMuted }}>
                Recommended: 256×256px with transparent background.
              </p>
              {/* URL fallback */}
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste logo URL..."
                className="w-full px-3 py-2 rounded-xl text-xs outline-none transition-all duration-200"
                style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
                onFocus={(e) => { e.currentTarget.style.borderColor = `${tokens.accentColor}44`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = tokens.cardBorder; }}
              />
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: tokens.textSecondary }}>
            Accent Color
          </label>
          <div className="flex items-center gap-3 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                className="w-8 h-8 rounded-full transition-all duration-200"
                style={{
                  background: color,
                  boxShadow: accentColor === color ? `0 0 0 3px ${tokens.isLightTheme ? "#fff" : "#1a1a1a"}, 0 0 0 5px ${color}` : "none",
                  transform: accentColor === color ? "scale(1.1)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-32 px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ background: tokens.inputBg, border: `1px solid ${tokens.cardBorder}`, color: tokens.textPrimary }}
            />
            <div
              className="flex-1 h-10 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-6 rounded-xl p-4" style={{ background: tokens.isLightTheme ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)", border: `1px solid ${tokens.cardBorder}` }}>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: tokens.textMuted }}>Live Preview</p>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: tokens.isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.4)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Preview" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="h-5 w-5" style={{ color: accentColor }} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>{org.name}</p>
              <p className="text-[10px]" style={{ color: accentColor }}>{org.industry || "Organization"}</p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              updateOrg.mutate({
                orgId: org.id,
                logoUrl: logoUrl || null,
                accentColor,
              });
            }}
            disabled={!hasChanges || updateOrg.isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: hasChanges ? tokens.accentColor : `${tokens.accentColor}30`,
              color: tokens.isLightTheme ? "#fff" : "#000",
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            <Save className="h-3.5 w-3.5" />
            {updateOrg.isPending ? "Saving..." : "Save Branding"}
          </button>
        </div>
      </div>
    </div>
  );
}
