/**
 * Admin Hub — Impersonate User
 *
 * Platform-owner-only page that lets you log in as any user
 * to verify their experience, permissions, and access levels.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Crown,
  Eye,
  Loader2,
  Building2,
  AlertTriangle,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const PLAN_COLORS: Record<string, { color: string; bg: string }> = {
  starter: { color: "oklch(0.65 0 0)", bg: "oklch(0.20 0 0)" },
  professional: { color: "oklch(0.75 0.15 250)", bg: "oklch(0.20 0.03 250)" },
  enterprise: { color: "oklch(0.82 0.12 85)", bg: "oklch(0.20 0.03 85)" },
  sovereign: { color: "oklch(0.82 0.12 55)", bg: "oklch(0.18 0.04 55)" },
};

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  account_owner: { color: "oklch(0.82 0.12 55)", bg: "oklch(0.18 0.04 55)" },
  super_admin: { color: "oklch(0.75 0.15 30)", bg: "oklch(0.20 0.03 30)" },
  org_admin: { color: "oklch(0.75 0.15 250)", bg: "oklch(0.20 0.03 250)" },
  manager: { color: "oklch(0.75 0.15 160)", bg: "oklch(0.20 0.03 160)" },
  member: { color: "oklch(0.65 0 0)", bg: "oklch(0.20 0 0)" },
  viewer: { color: "oklch(0.55 0 0)", bg: "oklch(0.18 0 0)" },
};

export default function AdminImpersonate() {
  const { user: currentUser } = useAuth();
  const [impersonating, setImpersonating] = useState<number | null>(null);
  const { data: targets, isLoading } = trpc.adminHub.listImpersonationTargets.useQuery();
  const impersonateMutation = trpc.adminHub.impersonateUser.useMutation({
    onSuccess: (data) => {
      toast.success(`Switching to ${data.targetUser.name || data.targetUser.email}...`);
      // Use the server-side endpoint to set the httpOnly cookie properly
      window.location.href = `/api/impersonate?token=${encodeURIComponent(data.sessionToken)}`;
    },
    onError: (err) => {
      toast.error(err.message);
      setImpersonating(null);
    },
  });

  if (!currentUser?.platformOwner) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Shield size={40} style={{ color: "oklch(0.45 0 0)" }} className="mx-auto" />
          <p style={{ color: "oklch(0.55 0 0)" }}>Platform owner access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: "oklch(0.92 0 0)" }}>
            <Eye size={20} style={{ color: "oklch(0.82 0.12 55)" }} />
            Impersonate User
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0 0)" }}>
            Log in as any user to verify their experience, permissions, and access levels.
            Sessions expire after 4 hours. All impersonations are logged in the audit trail.
          </p>
        </div>

        {/* Warning Banner */}
        <div
          className="rounded-lg p-4 flex items-start gap-3"
          style={{ background: "oklch(0.18 0.04 55)", border: "1px solid oklch(0.25 0.06 55)" }}
        >
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.82 0.12 55)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "oklch(0.82 0.12 55)" }}>
              Impersonation opens a new tab
            </p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.06 55)" }}>
              Your current admin session will be replaced with the impersonated user's session.
              To return to your admin account, log out and log back in with your credentials.
              Every impersonation is recorded in the platform audit log.
            </p>
          </div>
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={24} style={{ color: "oklch(0.55 0 0)" }} />
          </div>
        ) : (
          <div className="space-y-2">
            {(targets || []).map((target) => {
              const planKey = target.account?.plan || "starter";
              const planStyle = PLAN_COLORS[planKey] || PLAN_COLORS.starter;
              const isCurrentUser = target.id === currentUser?.id;
              const isImpersonatingThis = impersonating === target.id;

              return (
                <div
                  key={target.id}
                  className="rounded-lg p-4 flex items-center gap-4 transition-all"
                  style={{
                    background: isCurrentUser ? "oklch(0.14 0.02 85)" : "oklch(0.14 0.005 85)",
                    border: `1px solid ${isCurrentUser ? "oklch(0.25 0.04 85)" : "oklch(0.22 0.01 85)"}`,
                    opacity: isCurrentUser ? 0.6 : 1,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{ background: planStyle.bg, color: planStyle.color }}
                  >
                    {target.name?.charAt(0) || "?"}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: "oklch(0.92 0 0)" }}>
                        {target.name || "Unknown"}
                      </span>
                      {target.platformOwner && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: "oklch(0.18 0.04 55)", color: "oklch(0.82 0.12 55)" }}
                        >
                          PLATFORM OWNER
                        </span>
                      )}
                      {isCurrentUser && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: "oklch(0.20 0.03 160)", color: "oklch(0.75 0.15 160)" }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.55 0 0)" }}>
                      {target.email || "No email"} · User #{target.id}
                    </div>
                    {/* Account & Org Info */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {target.account && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                          style={{ background: planStyle.bg, color: planStyle.color }}
                        >
                          <Building2 size={10} />
                          {target.account.name} · {target.account.plan.toUpperCase()}
                        </span>
                      )}
                      {target.memberships.map((m) => {
                        const roleStyle = ROLE_COLORS[m.role] || ROLE_COLORS.member;
                        return (
                          <span
                            key={m.orgId}
                            className="text-[10px] px-2 py-0.5 rounded"
                            style={{ background: roleStyle.bg, color: roleStyle.color }}
                          >
                            {m.orgName} · {m.role.replace(/_/g, " ")}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Impersonate Button */}
                  {!isCurrentUser && (
                    <button
                      onClick={() => {
                        if (confirm(`Impersonate ${target.name || target.email}? This will open a new tab as that user.`)) {
                          setImpersonating(target.id);
                          impersonateMutation.mutate({ userId: target.id });
                        }
                      }}
                      disabled={impersonating !== null}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                      style={{
                        background: "oklch(0.18 0.04 55)",
                        color: "oklch(0.82 0.12 55)",
                        border: "1px solid oklch(0.25 0.06 55)",
                      }}
                    >
                      {isImpersonatingThis ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogIn size={14} />
                      )}
                      {isImpersonatingThis ? "Switching..." : "Impersonate"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
