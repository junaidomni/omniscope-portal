/**
 * Admin Hub — Plans & Billing
 * 
 * Super admin view for managing account subscriptions, viewing usage,
 * assigning plans, overriding limits, and monitoring billing status.
 * Standard pricing: $499, $999, $1,999, Custom
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CreditCard,
  Building2,
  Users,
  Crown,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Loader2,
  DollarSign,
  Save,
} from "lucide-react";

// Plan tier colors and icons
const PLAN_CONFIG: Record<string, { color: string; bg: string; icon: typeof Crown; label: string }> = {
  starter: { color: "oklch(0.65 0 0)", bg: "oklch(0.20 0 0)", icon: Zap, label: "Starter" },
  professional: { color: "oklch(0.75 0.15 250)", bg: "oklch(0.20 0.03 250)", icon: TrendingUp, label: "Professional" },
  enterprise: { color: "oklch(0.82 0.12 85)", bg: "oklch(0.20 0.03 85)", icon: Shield, label: "Enterprise" },
  sovereign: { color: "oklch(0.82 0.12 55)", bg: "oklch(0.18 0.04 55)", icon: Crown, label: "Sovereign" },
};

function getPlanStyle(key: string) {
  return PLAN_CONFIG[key] || PLAN_CONFIG.starter;
}

function formatLimit(val: number): string {
  if (val === -1) return "Unlimited";
  return val.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { color: string; bg: string }> = {
    active: { color: "oklch(0.75 0.15 160)", bg: "oklch(0.20 0.03 160)" },
    trialing: { color: "oklch(0.75 0.15 250)", bg: "oklch(0.20 0.03 250)" },
    past_due: { color: "oklch(0.75 0.15 55)", bg: "oklch(0.20 0.03 55)" },
    cancelled: { color: "oklch(0.65 0.15 25)", bg: "oklch(0.20 0.03 25)" },
    expired: { color: "oklch(0.55 0 0)", bg: "oklch(0.18 0 0)" },
  };
  const c = colors[status] || colors.expired;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ color: c.color, background: c.bg }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function PlanBadge({ planKey }: { planKey: string }) {
  const style = getPlanStyle(planKey);
  const Icon = style.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ color: style.color, background: style.bg }}
    >
      <Icon size={12} />
      {style.label}
    </span>
  );
}

/* ── Editable Plan Card ── */
function EditablePlanCard({ plan, onSave, isSaving }: {
  plan: any;
  onSave: (planId: number, data: any) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [monthly, setMonthly] = useState(plan.priceMonthly || "");
  const [annual, setAnnual] = useState(plan.priceAnnual || "");

  const style = getPlanStyle(plan.key);
  const Icon = style.icon;

  const handleSave = () => {
    onSave(plan.id, {
      priceMonthly: monthly === "" ? null : monthly,
      priceAnnual: annual === "" ? null : annual,
    });
    setEditing(false);
  };

  return (
    <div
      className="rounded-lg p-5 space-y-3 relative"
      style={{
        background: style.bg,
        border: `1px solid ${style.color}20`,
      }}
    >
      {/* Edit toggle */}
      <button
        onClick={() => setEditing(!editing)}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:opacity-80 transition-opacity"
        style={{ color: style.color, background: "oklch(0.16 0 0)" }}
        title="Edit pricing"
      >
        <Edit3 size={12} />
      </button>

      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color: style.color }} />
        <span className="font-semibold text-sm" style={{ color: style.color }}>
          {plan.name}
        </span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "oklch(0.55 0 0)" }}>
              Monthly Price ($)
            </label>
            <input
              type="text"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="e.g. 499.00 or leave empty for Custom"
              className="w-full text-sm rounded-md px-3 py-1.5 border-none outline-none"
              style={{ background: "oklch(0.16 0 0)", color: "oklch(0.92 0 0)" }}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "oklch(0.55 0 0)" }}>
              Annual Price ($)
            </label>
            <input
              type="text"
              value={annual}
              onChange={(e) => setAnnual(e.target.value)}
              placeholder="e.g. 4990.00 or leave empty"
              className="w-full text-sm rounded-md px-3 py-1.5 border-none outline-none"
              style={{ background: "oklch(0.16 0 0)", color: "oklch(0.92 0 0)" }}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
              style={{ color: "oklch(0.75 0.15 160)", background: "oklch(0.20 0.03 160)" }}
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
            <button
              onClick={() => {
                setMonthly(plan.priceMonthly || "");
                setAnnual(plan.priceAnnual || "");
                setEditing(false);
              }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
              style={{ color: "oklch(0.65 0.15 25)", background: "oklch(0.20 0.03 25)" }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold" style={{ color: "oklch(0.92 0 0)" }}>
            {plan.priceMonthly ? `$${Number(plan.priceMonthly).toLocaleString()}` : "Custom"}
            {plan.priceMonthly && (
              <span className="text-xs font-normal ml-1" style={{ color: "oklch(0.55 0 0)" }}>/mo</span>
            )}
          </div>
          {plan.priceAnnual && (
            <div className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
              ${Number(plan.priceAnnual).toLocaleString()}/yr
            </div>
          )}
        </>
      )}

      <div className="space-y-1.5 text-xs pt-1" style={{ color: "oklch(0.65 0 0)" }}>
        <div className="flex justify-between">
          <span>Contacts</span>
          <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(plan.maxContacts)}</span>
        </div>
        <div className="flex justify-between">
          <span>Meetings/mo</span>
          <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(plan.maxMeetingsPerMonth)}</span>
        </div>
        <div className="flex justify-between">
          <span>Users/org</span>
          <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(plan.maxUsersPerOrg)}</span>
        </div>
        <div className="flex justify-between">
          <span>Organizations</span>
          <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(plan.maxOrganizations)}</span>
        </div>
        <div className="flex justify-between">
          <span>Storage</span>
          <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(plan.maxStorageGb)} GB</span>
        </div>
      </div>

      {plan.features && plan.features.length > 0 && (
        <div className="pt-2" style={{ borderTop: `1px solid ${style.color}15` }}>
          <div className="text-[10px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "oklch(0.55 0 0)" }}>
            Features
          </div>
          <div className="flex flex-wrap gap-1">
            {plan.features.map((f: string) => (
              <span
                key={f}
                className="px-1.5 py-0.5 rounded text-[10px] capitalize"
                style={{ background: "oklch(0.16 0 0)", color: "oklch(0.65 0 0)" }}
              >
                {f.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Account Subscription Card ── */
function AccountCard({ account, plans, onRefresh }: {
  account: any;
  plans: any[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(account.plan?.key || account.plan || "starter");

  const assignPlan = trpc.plans.assignPlan.useMutation({
    onSuccess: (result) => {
      toast.success(`Plan ${result.action} successfully`);
      setEditingPlan(false);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelSub = trpc.plans.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled");
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const reactivateSub = trpc.plans.reactivateSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription reactivated");
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const planKey = account.plan?.key || account.plan || "starter";
  const planStyle = getPlanStyle(planKey);
  const subStatus = account.subscription?.status || "none";

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        background: "oklch(0.14 0.005 85)",
        border: `1px solid oklch(0.22 0.01 85)`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: planStyle.bg }}
          >
            <Building2 size={18} style={{ color: planStyle.color }} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate" style={{ color: "oklch(0.92 0 0)" }}>
              {account.name}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
              Account #{account.id} · {account.orgCount} org{account.orgCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <PlanBadge planKey={planKey} />
          {subStatus !== "none" && <StatusBadge status={subStatus} />}
          {expanded ? (
            <ChevronUp size={16} style={{ color: "oklch(0.55 0 0)" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "oklch(0.55 0 0)" }} />
          )}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid oklch(0.20 0.01 85)" }}>
          {/* Plan Assignment */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0 0)" }}>
                Subscription
              </h4>
              {!editingPlan && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingPlan(true); }}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.82 0.12 85)", background: "oklch(0.18 0.02 85)" }}
                >
                  <Edit3 size={12} /> Change Plan
                </button>
              )}
            </div>

            {editingPlan ? (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="text-sm rounded-md px-3 py-1.5 border-none outline-none"
                  style={{
                    background: "oklch(0.18 0 0)",
                    color: "oklch(0.92 0 0)",
                  }}
                >
                  {plans.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name} — {p.priceMonthly ? `$${Number(p.priceMonthly).toLocaleString()}/mo` : "Custom"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    assignPlan.mutate({ accountId: account.id, planKey: selectedPlan });
                  }}
                  disabled={assignPlan.isPending}
                  className="p-1.5 rounded hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.75 0.15 160)", background: "oklch(0.20 0.03 160)" }}
                >
                  {assignPlan.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setEditingPlan(false)}
                  className="p-1.5 rounded hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.65 0.15 25)", background: "oklch(0.20 0.03 25)" }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs block" style={{ color: "oklch(0.55 0 0)" }}>Plan</span>
                  <div style={{ color: "oklch(0.85 0 0)" }}>{account.plan?.name || capitalize(planKey)}</div>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: "oklch(0.55 0 0)" }}>Billing</span>
                  <div style={{ color: "oklch(0.85 0 0)" }}>
                    {account.subscription?.billingCycle || "—"}
                  </div>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: "oklch(0.55 0 0)" }}>Status</span>
                  <div>{subStatus !== "none" ? <StatusBadge status={subStatus} /> : <span style={{ color: "oklch(0.55 0 0)" }}>No subscription</span>}</div>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: "oklch(0.55 0 0)" }}>Since</span>
                  <div style={{ color: "oklch(0.85 0 0)" }}>
                    {account.subscription?.startDate
                      ? new Date(account.subscription.startDate).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Limits */}
          {account.limits && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.55 0 0)" }}>
                Limits
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "oklch(0.55 0 0)" }}>Max Contacts</span>
                  <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(account.limits.maxContacts)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "oklch(0.55 0 0)" }}>Meetings/mo</span>
                  <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(account.limits.maxMeetingsPerMonth)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "oklch(0.55 0 0)" }}>Users/Org</span>
                  <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(account.limits.maxUsersPerOrg)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "oklch(0.55 0 0)" }}>Max Orgs</span>
                  <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(account.limits.maxOrganizations)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "oklch(0.55 0 0)" }}>Storage</span>
                  <span style={{ color: "oklch(0.85 0 0)" }}>{formatLimit(account.limits.maxStorageGb)} GB</span>
                </div>
              </div>
            </div>
          )}

          {/* Organizations */}
          {account.orgs && account.orgs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.55 0 0)" }}>
                Organizations
              </h4>
              <div className="space-y-1">
                {account.orgs.map((org: any) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-sm"
                    style={{ background: "oklch(0.16 0 0)" }}
                  >
                    <span style={{ color: "oklch(0.85 0 0)" }}>{org.name}</span>
                    <span className="text-xs capitalize" style={{ color: "oklch(0.55 0 0)" }}>
                      {org.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap" style={{ borderTop: "1px solid oklch(0.20 0.01 85)" }}>
            {account.subscription && subStatus === "active" && (
              <button
                onClick={() => {
                  if (confirm("Cancel this subscription? The account will lose access to premium features.")) {
                    cancelSub.mutate({ subscriptionId: account.subscription.id });
                  }
                }}
                disabled={cancelSub.isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.65 0.15 25)", background: "oklch(0.18 0.02 25)" }}
              >
                {cancelSub.isPending ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
                Cancel Subscription
              </button>
            )}
            {account.subscription && subStatus === "cancelled" && (
              <button
                onClick={() => reactivateSub.mutate({ subscriptionId: account.subscription.id })}
                disabled={reactivateSub.isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.75 0.15 160)", background: "oklch(0.18 0.03 160)" }}
              >
                {reactivateSub.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Reactivate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Main Page ── */
export default function AdminBilling() {
  const utils = trpc.useUtils();
  const { data: plans, isLoading: plansLoading } = trpc.plans.list.useQuery();
  const { data: accounts, isLoading: accountsLoading, refetch } = trpc.plans.listAccounts.useQuery();

  const updatePlan = trpc.plans.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plan pricing updated");
      utils.plans.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading = plansLoading || accountsLoading;

  // Stats
  const totalAccounts = accounts?.length || 0;
  const activeSubscriptions = accounts?.filter((a) => a.subscription?.status === "active").length || 0;
  const totalOrgs = accounts?.reduce((sum, a) => sum + a.orgCount, 0) || 0;

  const handlePlanSave = (planId: number, data: any) => {
    updatePlan.mutate({ planId, ...data });
  };

  return (
    <div className="p-8">
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "oklch(0.92 0 0)" }}>
          Plans & Billing
        </h1>
        <p className="text-sm mt-1" style={{ color: "oklch(0.55 0 0)" }}>
          Manage plan pricing, account subscriptions, and billing. Click the edit icon on any plan to change pricing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Accounts", value: totalAccounts, icon: Building2 },
          { label: "Active Subscriptions", value: activeSubscriptions, icon: CreditCard },
          { label: "Organizations", value: totalOrgs, icon: Users },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-4 flex items-center gap-3"
            style={{ background: "oklch(0.14 0.005 85)", border: "1px solid oklch(0.22 0.01 85)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.18 0.02 85)" }}
            >
              <stat.icon size={16} style={{ color: "oklch(0.82 0.12 85)" }} />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ color: "oklch(0.92 0 0)" }}>
                {isLoading ? "—" : stat.value}
              </div>
              <div className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Tiers — responsive grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "oklch(0.75 0 0)" }}>
            Standard Pricing Tiers
          </h2>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.55 0 0)" }}>
            <DollarSign size={12} />
            Click edit icon to change pricing
          </div>
        </div>
        {plansLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={20} style={{ color: "oklch(0.55 0 0)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(plans || []).map((plan) => (
              <EditablePlanCard
                key={plan.key}
                plan={plan}
                onSave={handlePlanSave}
                isSaving={updatePlan.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "oklch(0.75 0 0)" }}>
            Account Subscriptions
          </h2>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.65 0 0)", background: "oklch(0.18 0 0)" }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        {accountsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={20} style={{ color: "oklch(0.55 0 0)" }} />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                plans={plans || []}
                onRefresh={() => refetch()}
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-lg p-8 text-center"
            style={{ background: "oklch(0.14 0.005 85)", border: "1px solid oklch(0.22 0.01 85)" }}
          >
            <CreditCard size={32} className="mx-auto mb-2" style={{ color: "oklch(0.35 0 0)" }} />
            <p className="text-sm" style={{ color: "oklch(0.55 0 0)" }}>
              No accounts found. Accounts are created automatically when users sign up.
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
