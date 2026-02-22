/**
 * Admin Hub — Super-Admin Management (H-6)
 * Grant/revoke platform owner access with audit logging.
 */
import { trpc } from "@/lib/trpc";
import { useDesign } from "@/components/PortalLayout";
import {
  Crown,
  Shield,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function SuperAdmins() {
  const { isLightTheme } = useDesign();
  const utils = trpc.useUtils();

  const { data: platformOwners, isLoading: ownersLoading } = trpc.adminHub.listPlatformOwners.useQuery();
  const { data: auditTrail, isLoading: auditLoading } = trpc.adminHub.getPlatformOwnerAuditTrail.useQuery();
  const { data: allUsers } = trpc.adminHub.listAllUsersForAdmin.useQuery();

  const [search, setSearch] = useState("");
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantSearch, setGrantSearch] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState<number | null>(null);

  const grant = trpc.adminHub.hubGrantPlatformOwner.useMutation({
    onSuccess: () => {
      toast.success("Platform owner access granted");
      utils.adminHub.listPlatformOwners.invalidate();
      utils.adminHub.getPlatformOwnerAuditTrail.invalidate();
      utils.adminHub.listAllUsersForAdmin.invalidate();
      setShowGrantDialog(false);
      setGrantSearch("");
    },
    onError: (err) => toast.error(err.message),
  });

  const revoke = trpc.adminHub.hubRevokePlatformOwner.useMutation({
    onSuccess: () => {
      toast.success("Platform owner access revoked");
      utils.adminHub.listPlatformOwners.invalidate();
      utils.adminHub.getPlatformOwnerAuditTrail.invalidate();
      utils.adminHub.listAllUsersForAdmin.invalidate();
      setConfirmRevoke(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Theme colors
  const textPrimary = isLightTheme ? "oklch(0.15 0 0)" : "oklch(0.92 0.02 85)";
  const textSecondary = isLightTheme ? "oklch(0.40 0 0)" : "oklch(0.60 0.02 0)";
  const textMuted = isLightTheme ? "oklch(0.55 0 0)" : "oklch(0.48 0.01 0)";
  const cardBg = isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.03)";
  const cardBorder = isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const inputBg = isLightTheme ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";
  const goldAccent = "oklch(0.75 0.12 70)";
  const dangerColor = "oklch(0.65 0.2 25)";
  const dangerBg = "oklch(0.20 0.04 25)";
  const successColor = "oklch(0.72 0.19 145)";
  const overlayBg = "rgba(0,0,0,0.6)";
  const dialogBg = isLightTheme ? "oklch(0.98 0 0)" : "oklch(0.13 0.01 60)";

  // Filter owners by search
  const filteredOwners = useMemo(() => {
    if (!platformOwners) return [];
    if (!search) return platformOwners;
    const q = search.toLowerCase();
    return platformOwners.filter(
      (u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [platformOwners, search]);

  // Filter non-owners for grant dialog
  const grantCandidates = useMemo(() => {
    if (!allUsers) return [];
    const ownerIds = new Set((platformOwners || []).map((o) => o.id));
    let candidates = allUsers.filter((u) => !ownerIds.has(u.id));
    if (grantSearch) {
      const q = grantSearch.toLowerCase();
      candidates = candidates.filter(
        (u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
      );
    }
    return candidates;
  }, [allUsers, platformOwners, grantSearch]);

  if (ownersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: textMuted }} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${goldAccent}, oklch(0.65 0.14 55))` }}
              >
                <Crown className="w-5 h-5" style={{ color: "oklch(0.10 0 0)" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>
                  Super-Admin Management
                </h1>
                <p className="text-sm mt-0.5" style={{ color: textSecondary }}>
                  Grant or revoke platform owner access. All changes are audit-logged.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowGrantDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${goldAccent}, oklch(0.65 0.14 55))`,
              color: "oklch(0.10 0 0)",
            }}
          >
            <UserPlus className="w-4 h-4" />
            Grant Access
          </button>
        </div>

        {/* Current Platform Owners */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
              Current Platform Owners ({platformOwners?.length ?? 0})
            </h2>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
              <input
                type="text"
                placeholder="Search owners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                style={{ background: inputBg, borderColor: cardBorder, color: textPrimary }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredOwners.map((owner) => (
              <div
                key={owner.id}
                className="rounded-xl border p-4 flex items-center justify-between"
                style={{ background: cardBg, borderColor: cardBorder }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.25 0.02 60), oklch(0.20 0.02 60))`,
                      color: goldAccent,
                    }}
                  >
                    {(owner.name || owner.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: textPrimary }}>
                      {owner.name || "Unnamed User"}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: textMuted }}>
                      {owner.email || "No email"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ color: goldAccent, background: "oklch(0.18 0.04 55)" }}
                    >
                      <Crown className="w-3 h-3" />
                      Platform Owner
                    </span>
                    {owner.role === "admin" && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: "oklch(0.75 0.15 250)", background: "oklch(0.20 0.03 250)" }}
                      >
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <div className="text-xs" style={{ color: textMuted }}>Last sign-in</div>
                    <div className="text-xs font-mono" style={{ color: textSecondary }}>
                      {owner.lastSignedIn ? new Date(owner.lastSignedIn).toLocaleDateString() : "Never"}
                    </div>
                  </div>
                  {confirmRevoke === owner.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: dangerColor }}>Confirm?</span>
                      <button
                        onClick={() => revoke.mutate({ userId: owner.id })}
                        disabled={revoke.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: dangerBg, color: dangerColor }}
                      >
                        {revoke.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revoke"}
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                        style={{ borderColor: cardBorder, color: textSecondary }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(owner.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-red-500/30"
                      style={{ borderColor: cardBorder, color: textSecondary }}
                    >
                      <UserMinus className="w-3 h-3" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredOwners.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: textMuted }}>
                No platform owners found.
              </div>
            )}
          </div>
        </div>

        {/* Audit Trail */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: textMuted }}>
            Access Change History
          </h2>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: cardBorder }}>
            {auditLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: textMuted }} />
              </div>
            ) : (auditTrail ?? []).length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: textMuted }}>
                No access changes recorded yet.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: cardBorder }}>
                {(auditTrail ?? []).map((event: any) => {
                  const isGrant = event.action === "platform_owner_grant";
                  const details = event.details ? (typeof event.details === "string" ? JSON.parse(event.details) : event.details) : {};
                  return (
                    <div key={event.id} className="px-4 py-3 flex items-center gap-4" style={{ background: cardBg }}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: isGrant ? "oklch(0.18 0.04 145)" : dangerBg,
                          color: isGrant ? successColor : dangerColor,
                        }}
                      >
                        {isGrant ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm" style={{ color: textPrimary }}>
                          <span className="font-medium">{event.userName || event.userEmail || "System"}</span>
                          {" "}
                          <span style={{ color: isGrant ? successColor : dangerColor }}>
                            {isGrant ? "granted" : "revoked"}
                          </span>
                          {" platform owner access "}
                          {isGrant ? "to" : "from"}
                          {" "}
                          <span className="font-medium">{details.targetName || details.targetEmail || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: textMuted }}>
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grant Access Dialog */}
      {showGrantDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: overlayBg }}
          onClick={(e) => e.target === e.currentTarget && setShowGrantDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: dialogBg, borderColor: cardBorder }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: cardBorder }}>
              <h3 className="text-lg font-bold" style={{ color: textPrimary }}>Grant Platform Owner Access</h3>
              <p className="text-xs mt-1" style={{ color: textSecondary }}>
                Search for a user to grant platform owner privileges. This action is audit-logged.
              </p>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={grantSearch}
                  onChange={(e) => setGrantSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: inputBg, borderColor: cardBorder, color: textPrimary }}
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {grantCandidates.length === 0 ? (
                  <div className="text-center py-6 text-sm" style={{ color: textMuted }}>
                    {grantSearch ? "No matching users found." : "All users already have platform owner access."}
                  </div>
                ) : (
                  grantCandidates.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:border-amber-500/30"
                      style={{ borderColor: cardBorder, background: cardBg }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "oklch(0.20 0 0)", color: textSecondary }}
                        >
                          {(user.name || user.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: textPrimary }}>
                            {user.name || "Unnamed"}
                          </div>
                          <div className="text-xs" style={{ color: textMuted }}>{user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => grant.mutate({ userId: user.id })}
                        disabled={grant.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${goldAccent}, oklch(0.65 0.14 55))`,
                          color: "oklch(0.10 0 0)",
                        }}
                      >
                        {grant.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Grant"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end" style={{ borderColor: cardBorder }}>
              <button
                onClick={() => { setShowGrantDialog(false); setGrantSearch(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: cardBorder, color: textSecondary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
