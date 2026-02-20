/**
 * Admin Hub — Feature Flags
 * Toggle features globally and per-org based on plan tiers.
 * Plan hierarchy: Starter → Professional → Enterprise
 */
import { trpc } from "@/lib/trpc";
import { useDesign } from "@/components/PortalLayout";
import {
  ToggleLeft, ToggleRight, Search, Lock, Shield, Crown,
  Zap, Star, ChevronDown, Building2, Filter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  communication: "Communication",
  intelligence: "Intelligence",
  operations: "Operations",
  experimental: "Experimental",
};

const CATEGORY_COLORS: Record<string, string> = {
  core: "#10b981",
  communication: "#3b82f6",
  intelligence: "#a855f7",
  operations: "#f59e0b",
  experimental: "#ef4444",
};

const PLAN_CONFIG: Record<string, { label: string; icon: any; color: string; level: number }> = {
  starter: { label: "Starter", icon: Zap, color: "#64748b", level: 0 },
  professional: { label: "Professional", icon: Star, color: "#3b82f6", level: 1 },
  enterprise: { label: "Enterprise", icon: Crown, color: "#d4af37", level: 2 },
};

type ViewMode = "global" | "plan-matrix";

export default function AdminHubFeatures() {
  const { data: features, isLoading, refetch } = trpc.adminHub.listAllFeatureToggles.useQuery();
  const { data: orgs } = trpc.adminHub.listOrganizations.useQuery();
  const toggleMutation = trpc.adminHub.toggleFeature.useMutation({
    onSuccess: () => { refetch(); toast.success("Feature flag updated"); },
    onError: (err) => toast.error(err.message || "Failed to update"),
  });
  const updatePlanMutation = trpc.adminHub.updateFeaturePlan.useMutation({
    onSuccess: () => { refetch(); toast.success("Plan requirement updated"); },
    onError: (err) => toast.error(err.message || "Failed to update plan"),
  });

  const { accentColor, isLightTheme } = useDesign();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("global");
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const cardBg = isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.03)";
  const cardBorder = isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const textPrimary = isLightTheme ? "oklch(0.15 0 0)" : "oklch(0.92 0.02 85)";
  const textSecondary = isLightTheme ? "oklch(0.40 0 0)" : "oklch(0.60 0.02 0)";
  const textMuted = isLightTheme ? "oklch(0.55 0 0)" : "oklch(0.48 0.01 0)";
  const inputBg = isLightTheme ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";

  const filtered = (features ?? []).filter((f) => {
    const matchesSearch =
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.featureKey.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const enabledCount = (features ?? []).filter((f) => f.enabled).length;
  const lockedCount = (features ?? []).filter((f) => f.isLocked).length;
  const categories = [...new Set((features ?? []).map((f) => f.category))];

  // Group features by plan
  const byPlan = {
    starter: (features ?? []).filter((f) => f.requiredPlan === "starter"),
    professional: (features ?? []).filter((f) => f.requiredPlan === "professional"),
    enterprise: (features ?? []).filter((f) => f.requiredPlan === "enterprise"),
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>
              Feature Flags
            </h1>
            <p className="text-sm mt-1" style={{ color: textSecondary }}>
              Control feature availability globally and by plan tier. Changes apply to all organizations on that plan.
            </p>
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: inputBg, border: `1px solid ${cardBorder}` }}>
            <button
              onClick={() => setViewMode("global")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: viewMode === "global" ? `${accentColor}15` : "transparent",
                color: viewMode === "global" ? accentColor : textSecondary,
              }}
            >
              Global View
            </button>
            <button
              onClick={() => setViewMode("plan-matrix")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: viewMode === "plan-matrix" ? `${accentColor}15` : "transparent",
                color: viewMode === "plan-matrix" ? accentColor : textSecondary,
              }}
            >
              Plan Matrix
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ToggleRight className="h-4 w-4" style={{ color: "#10b981" }} />
            <span className="text-sm font-medium" style={{ color: textPrimary }}>
              {enabledCount} enabled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" style={{ color: "#64748b" }} />
            <span className="text-sm" style={{ color: textSecondary }}>
              {(features ?? []).length - enabledCount} disabled
            </span>
          </div>
          {lockedCount > 0 && (
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span className="text-sm" style={{ color: textSecondary }}>
                {lockedCount} locked
              </span>
            </div>
          )}
          <div className="h-4 w-px" style={{ background: cardBorder }} />
          {Object.entries(PLAN_CONFIG).map(([key, plan]) => {
            const PlanIcon = plan.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <PlanIcon className="h-3.5 w-3.5" style={{ color: plan.color }} />
                <span className="text-xs" style={{ color: textMuted }}>
                  {byPlan[key as keyof typeof byPlan]?.length ?? 0} {plan.label}
                </span>
              </div>
            );
          })}
        </div>

        {viewMode === "plan-matrix" ? (
          /* ─── Plan Matrix View ─── */
          <div className="space-y-6">
            {(["starter", "professional", "enterprise"] as const).map((planKey) => {
              const plan = PLAN_CONFIG[planKey];
              const PlanIcon = plan.icon;
              const planFeatures = byPlan[planKey];
              return (
                <div key={planKey} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${plan.color}22` }}>
                  {/* Plan Header */}
                  <div
                    className="px-5 py-4 flex items-center justify-between"
                    style={{ background: `${plan.color}08` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${plan.color}15` }}
                      >
                        <PlanIcon className="h-4.5 w-4.5" style={{ color: plan.color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                          {plan.label} Plan
                        </h3>
                        <p className="text-[10px]" style={{ color: textMuted }}>
                          {planFeatures.length} feature{planFeatures.length !== 1 ? "s" : ""} at this tier
                          {planKey !== "starter" && ` · Includes all ${PLAN_CONFIG[planKey === "enterprise" ? "professional" : "starter"].label} features`}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{ background: `${plan.color}15`, color: plan.color }}
                    >
                      {planFeatures.filter((f) => f.enabled).length}/{planFeatures.length} active
                    </span>
                  </div>
                  {/* Features in this plan */}
                  <div className="divide-y" style={{ borderColor: cardBorder }}>
                    {planFeatures.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <p className="text-xs" style={{ color: textMuted }}>No features assigned to this plan tier.</p>
                      </div>
                    ) : (
                      planFeatures.map((feature) => (
                        <FeatureRow
                          key={feature.id}
                          feature={feature}
                          tokens={{ cardBg, cardBorder, textPrimary, textSecondary, textMuted, inputBg, accentColor, isLightTheme }}
                          onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
                          onChangePlan={(id, plan) => updatePlanMutation.mutate({ id, requiredPlan: plan })}
                          isToggling={toggleMutation.isPending}
                          expanded={expandedFeature === feature.id}
                          onExpand={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── Global View ─── */
          <>
            {/* Search + Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: textMuted }} />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}44`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = cardBorder; }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: !categoryFilter ? `${accentColor}15` : inputBg,
                    color: !categoryFilter ? accentColor : textSecondary,
                    border: `1px solid ${!categoryFilter ? `${accentColor}30` : cardBorder}`,
                  }}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: categoryFilter === cat ? `${CATEGORY_COLORS[cat] || accentColor}15` : inputBg,
                      color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || accentColor) : textSecondary,
                      border: `1px solid ${categoryFilter === cat ? `${CATEGORY_COLORS[cat] || accentColor}30` : cardBorder}`,
                    }}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature List */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: cardBg }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: textMuted }} />
                <p className="text-sm" style={{ color: textSecondary }}>
                  {search || categoryFilter ? "No features match your filters." : "No feature flags configured."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    feature={feature}
                    tokens={{ cardBg, cardBorder, textPrimary, textSecondary, textMuted, inputBg, accentColor, isLightTheme }}
                    onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
                    onChangePlan={(id, plan) => updatePlanMutation.mutate({ id, requiredPlan: plan })}
                    isToggling={toggleMutation.isPending}
                    expanded={expandedFeature === feature.id}
                    onExpand={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Feature Row Component ─── */
function FeatureRow({
  feature,
  tokens,
  onToggle,
  onChangePlan,
  isToggling,
  expanded,
  onExpand,
}: {
  feature: any;
  tokens: any;
  onToggle: (id: number, enabled: boolean) => void;
  onChangePlan: (id: number, plan: "starter" | "professional" | "enterprise") => void;
  isToggling: boolean;
  expanded: boolean;
  onExpand: () => void;
}) {
  const plan = PLAN_CONFIG[feature.requiredPlan] || PLAN_CONFIG.starter;
  const PlanIcon = plan.icon;

  return (
    <div>
      <div
        className="rounded-2xl p-4 transition-all duration-200 flex items-center gap-4"
        style={{
          background: tokens.cardBg,
          border: `1px solid ${feature.enabled ? `${tokens.accentColor}22` : tokens.cardBorder}`,
          opacity: feature.isLocked ? 0.85 : 1,
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: feature.enabled
              ? `${CATEGORY_COLORS[feature.category] || tokens.accentColor}15`
              : `${tokens.textMuted}10`,
          }}
        >
          {feature.isLocked ? (
            <Lock className="h-4 w-4" style={{ color: tokens.accentColor }} />
          ) : feature.enabled ? (
            <ToggleRight className="h-4 w-4" style={{ color: CATEGORY_COLORS[feature.category] || tokens.accentColor }} />
          ) : (
            <ToggleLeft className="h-4 w-4" style={{ color: tokens.textMuted }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              {feature.label}
            </p>
            {feature.isLocked && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: `${tokens.accentColor}15`, color: tokens.accentColor }}
              >
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-[10px] font-mono" style={{ color: tokens.textMuted }}>
              {feature.featureKey}
            </code>
            {feature.description && (
              <>
                <span style={{ color: tokens.textMuted }}>·</span>
                <p className="text-xs truncate" style={{ color: tokens.textMuted }}>
                  {feature.description}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Plan Badge */}
        <button
          onClick={onExpand}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 transition-all duration-200 hover:opacity-80"
          style={{
            background: `${plan.color}12`,
            color: plan.color,
            border: `1px solid ${plan.color}25`,
          }}
          title="Click to change plan requirement"
        >
          <PlanIcon className="h-3 w-3" />
          {plan.label}
          <ChevronDown className="h-2.5 w-2.5" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms" }} />
        </button>

        {/* Category Badge */}
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0"
          style={{
            background: `${CATEGORY_COLORS[feature.category] || tokens.accentColor}12`,
            color: CATEGORY_COLORS[feature.category] || tokens.textSecondary,
          }}
        >
          {CATEGORY_LABELS[feature.category] || feature.category}
        </span>

        {/* Toggle Switch */}
        <button
          onClick={() => {
            if (feature.isLocked) {
              toast.error("This feature is locked and cannot be toggled.");
              return;
            }
            onToggle(feature.id, !feature.enabled);
          }}
          disabled={isToggling || feature.isLocked}
          className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
          style={{
            background: feature.isLocked
              ? (tokens.isLightTheme ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)")
              : feature.enabled
                ? tokens.accentColor
                : (tokens.isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"),
            cursor: feature.isLocked ? "not-allowed" : "pointer",
          }}
          title={feature.isLocked ? "This feature is locked" : feature.enabled ? "Click to disable" : "Click to enable"}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm"
            style={{
              left: feature.enabled ? "26px" : "2px",
              background: tokens.isLightTheme ? "#fff" : "#1a1a1a",
            }}
          />
        </button>
      </div>

      {/* Expanded Plan Selector */}
      {expanded && (
        <div
          className="mx-4 mt-1 mb-2 rounded-xl p-3 flex items-center gap-3"
          style={{ background: tokens.isLightTheme ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", border: `1px solid ${tokens.cardBorder}` }}
        >
          <p className="text-[10px] uppercase tracking-widest font-medium shrink-0" style={{ color: tokens.textMuted }}>
            Required Plan:
          </p>
          {(["starter", "professional", "enterprise"] as const).map((planKey) => {
            const p = PLAN_CONFIG[planKey];
            const PI = p.icon;
            const isActive = feature.requiredPlan === planKey;
            return (
              <button
                key={planKey}
                onClick={() => onChangePlan(feature.id, planKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? `${p.color}15` : "transparent",
                  color: isActive ? p.color : tokens.textMuted,
                  border: `1px solid ${isActive ? `${p.color}30` : tokens.cardBorder}`,
                }}
              >
                <PI className="h-3 w-3" />
                {p.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <p className="text-[10px]" style={{ color: tokens.textMuted }}>
            Orgs on lower plans won't see this feature
          </p>
        </div>
      )}
    </div>
  );
}
