import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Organization shape as returned from the server
 */
export interface OrgInfo {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
  industry: string | null;
  domain: string | null;
  timezone: string | null;
  status: string;
  onboardingCompleted: boolean;
}

export interface OrgMembership {
  id: number;
  role: string;
  isDefault: boolean;
  joinedAt: Date;
  org: OrgInfo;
}

export interface AccountInfo {
  id: number;
  name: string;
  plan: string;
  status: string;
  maxOrganizations: number;
  maxUsersPerOrg: number;
}

interface OrgContextValue {
  /** The user's account (null if not provisioned yet) */
  account: AccountInfo | null;
  /** All orgs the user belongs to */
  memberships: OrgMembership[];
  /** The currently active org (null = "All Organizations" consolidated view) */
  currentOrg: OrgInfo | null;
  /** The user's role in the current org */
  currentRole: string | null;
  /** Whether the org data is still loading */
  isLoading: boolean;
  /** Whether the user has been provisioned (has an account) */
  isProvisioned: boolean;
  /** Whether the user needs onboarding (no orgs or no completed onboarding) */
  needsOnboarding: boolean;
  /** Switch to a different org */
  switchOrg: (orgId: number | null) => void;
  /** Refresh org data from server */
  refresh: () => void;
  /** Auto-provision the user's account */
  provision: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

const ORG_STORAGE_KEY = "omniscope-current-org-id";

export function OrgProvider({ children }: { children: React.ReactNode }) {
  // Track which org is selected locally (persisted in localStorage)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(() => {
    const stored = localStorage.getItem(ORG_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  // Fetch org data from server
  const orgsQuery = trpc.organizations.getMyOrgs.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000, // 1 minute
  });

  const switchMutation = trpc.organizations.switchOrg.useMutation();
  const provisionMutation = trpc.organizations.autoProvision.useMutation();
  const utils = trpc.useUtils();

  const memberships: OrgMembership[] = useMemo(() => {
    return (orgsQuery.data?.memberships ?? []) as OrgMembership[];
  }, [orgsQuery.data?.memberships]);

  const account: AccountInfo | null = useMemo(() => {
    return (orgsQuery.data?.account as AccountInfo) ?? null;
  }, [orgsQuery.data?.account]);

  // Determine current org based on selectedOrgId or default
  const currentOrg: OrgInfo | null = useMemo(() => {
    if (selectedOrgId === null) return null; // "All Organizations" view
    const match = memberships.find((m) => m.org.id === selectedOrgId);
    if (match) return match.org;
    // Fall back to default org
    const defaultMembership = memberships.find((m) => m.isDefault);
    if (defaultMembership) return defaultMembership.org;
    // Fall back to first org
    return memberships[0]?.org ?? null;
  }, [selectedOrgId, memberships]);

  const currentRole: string | null = useMemo(() => {
    if (!currentOrg) return null;
    const match = memberships.find((m) => m.org.id === currentOrg.id);
    return match?.role ?? null;
  }, [currentOrg, memberships]);

  // Sync selectedOrgId with the actual default when data loads
  useEffect(() => {
    if (memberships.length === 0) return;
    const stored = localStorage.getItem(ORG_STORAGE_KEY);
    if (stored) {
      const storedId = parseInt(stored, 10);
      const exists = memberships.some((m) => m.org.id === storedId);
      if (exists) return; // stored value is valid
    }
    // Set to default org
    const defaultM = memberships.find((m) => m.isDefault);
    const orgId = defaultM?.org.id ?? memberships[0]?.org.id;
    if (orgId) {
      setSelectedOrgId(orgId);
      localStorage.setItem(ORG_STORAGE_KEY, String(orgId));
    }
  }, [memberships]);

  const switchOrg = useCallback(
    (orgId: number | null) => {
      setSelectedOrgId(orgId);
      if (orgId !== null) {
        localStorage.setItem(ORG_STORAGE_KEY, String(orgId));
        // Tell server to update default
        switchMutation.mutate({ orgId }, {
          onSuccess: () => {
            utils.organizations.getMyOrgs.invalidate();
          },
        });
      } else {
        localStorage.removeItem(ORG_STORAGE_KEY);
      }
    },
    [switchMutation, utils]
  );

  const refresh = useCallback(() => {
    utils.organizations.getMyOrgs.invalidate();
  }, [utils]);

  const provision = useCallback(async () => {
    await provisionMutation.mutateAsync();
    utils.organizations.getMyOrgs.invalidate();
  }, [provisionMutation, utils]);

  const isProvisioned = !!account;
  const needsOnboarding = memberships.length === 0 || memberships.every((m) => !m.org.onboardingCompleted);

  const value: OrgContextValue = useMemo(
    () => ({
      account,
      memberships,
      currentOrg,
      currentRole,
      isLoading: orgsQuery.isLoading,
      isProvisioned,
      needsOnboarding,
      switchOrg,
      refresh,
      provision,
    }),
    [account, memberships, currentOrg, currentRole, orgsQuery.isLoading, isProvisioned, needsOnboarding, switchOrg, refresh, provision]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/**
 * Hook to access the current org context.
 * Must be used within an OrgProvider.
 */
export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
