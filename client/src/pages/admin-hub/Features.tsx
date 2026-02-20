/**
 * Admin Hub — Feature Flags
 * Toggle features across all organizations. Respects isLocked flag.
 */
import { trpc } from "@/lib/trpc";
import { useDesign } from "@/components/PortalLayout";
import { ToggleLeft, ToggleRight, Search, Lock, Shield } from "lucide-react";
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

export default function AdminHubFeatures() {
  const { data: features, isLoading, refetch } = trpc.adminHub.listAllFeatureToggles.useQuery();
  const toggleMutation = trpc.adminHub.toggleFeature.useMutation({
    onSuccess: () => { refetch(); toast.success("Feature flag updated"); },
    onError: (err) => toast.error(err.message || "Failed to update feature flag"),
  });
  const { accentColor, isLightTheme } = useDesign();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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

  // Get unique categories from data
  const categories = [...new Set((features ?? []).map((f) => f.category))];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>
            Feature Flags
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary }}>
            Toggle features across the entire platform. Changes apply to all organizations immediately.
          </p>
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
        </div>

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
              <div
                key={feature.id}
                className="rounded-2xl p-4 transition-all duration-200 flex items-center gap-4"
                style={{
                  background: cardBg,
                  border: `1px solid ${feature.enabled ? `${accentColor}22` : cardBorder}`,
                  opacity: feature.isLocked ? 0.85 : 1,
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: feature.enabled
                      ? `${CATEGORY_COLORS[feature.category] || accentColor}15`
                      : `${textMuted}10`,
                  }}
                >
                  {feature.isLocked ? (
                    <Lock className="h-4 w-4" style={{ color: accentColor }} />
                  ) : feature.enabled ? (
                    <ToggleRight className="h-4 w-4" style={{ color: CATEGORY_COLORS[feature.category] || accentColor }} />
                  ) : (
                    <ToggleLeft className="h-4 w-4" style={{ color: textMuted }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: textPrimary }}>
                      {feature.label}
                    </p>
                    {feature.isLocked && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                        style={{ background: `${accentColor}15`, color: accentColor }}
                      >
                        Locked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-[10px] font-mono" style={{ color: textMuted }}>
                      {feature.featureKey}
                    </code>
                    {feature.description && (
                      <>
                        <span style={{ color: textMuted }}>·</span>
                        <p className="text-xs truncate" style={{ color: textMuted }}>
                          {feature.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0"
                  style={{
                    background: `${CATEGORY_COLORS[feature.category] || accentColor}12`,
                    color: CATEGORY_COLORS[feature.category] || textSecondary,
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
                    toggleMutation.mutate({ id: feature.id, enabled: !feature.enabled });
                  }}
                  disabled={toggleMutation.isPending || feature.isLocked}
                  className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
                  style={{
                    background: feature.isLocked
                      ? (isLightTheme ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)")
                      : feature.enabled
                        ? accentColor
                        : (isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"),
                    cursor: feature.isLocked ? "not-allowed" : "pointer",
                  }}
                  title={feature.isLocked ? "This feature is locked" : feature.enabled ? "Click to disable" : "Click to enable"}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      left: feature.enabled ? "26px" : "2px",
                      background: isLightTheme ? "#fff" : "#1a1a1a",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
