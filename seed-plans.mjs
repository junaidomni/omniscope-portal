/**
 * Seed the plans table with the four OmniScope tiers.
 * Run: node seed-plans.mjs
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const plans = [
  {
    key: "starter",
    name: "Starter",
    description: "For individuals and small teams getting started with OmniScope. Core CRM, meeting intelligence, and task management.",
    tier: 0,
    priceMonthly: "49.00",
    priceAnnual: "470.00",
    currency: "USD",
    maxOrganizations: 1,
    maxUsersPerOrg: 3,
    maxContacts: 500,
    maxMeetingsPerMonth: 50,
    maxStorageGb: 5,
    includesCore: true,
    includesCommunication: false,
    includesIntelligence: false,
    includesOperations: false,
    includesExperimental: false,
    hasApiAccess: false,
    hasPrioritySupport: false,
    hasWhiteLabel: false,
    hasDedicatedAccount: false,
    hasCustomIntegrations: false,
    sortOrder: 0,
  },
  {
    key: "professional",
    name: "Professional",
    description: "For growing teams that need email integration, AI intelligence, and advanced reporting.",
    tier: 1,
    priceMonthly: "149.00",
    priceAnnual: "1430.00",
    currency: "USD",
    maxOrganizations: 3,
    maxUsersPerOrg: 10,
    maxContacts: 5000,
    maxMeetingsPerMonth: 200,
    maxStorageGb: 25,
    includesCore: true,
    includesCommunication: true,
    includesIntelligence: true,
    includesOperations: true,
    includesExperimental: false,
    hasApiAccess: false,
    hasPrioritySupport: false,
    hasWhiteLabel: false,
    hasDedicatedAccount: false,
    hasCustomIntegrations: false,
    sortOrder: 1,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "For organizations requiring full platform access, API integrations, priority support, and advanced compliance tools.",
    tier: 2,
    priceMonthly: "499.00",
    priceAnnual: "4790.00",
    currency: "USD",
    maxOrganizations: 10,
    maxUsersPerOrg: 50,
    maxContacts: -1,
    maxMeetingsPerMonth: -1,
    maxStorageGb: 100,
    includesCore: true,
    includesCommunication: true,
    includesIntelligence: true,
    includesOperations: true,
    includesExperimental: true,
    hasApiAccess: true,
    hasPrioritySupport: true,
    hasWhiteLabel: false,
    hasDedicatedAccount: false,
    hasCustomIntegrations: true,
    sortOrder: 2,
  },
  {
    key: "sovereign",
    name: "Sovereign",
    description: "White-glove, custom-priced tier for sovereign entities, family offices, and institutional clients. Dedicated infrastructure, white-label, and bespoke integrations.",
    tier: 3,
    priceMonthly: null,
    priceAnnual: null,
    currency: "USD",
    maxOrganizations: -1,
    maxUsersPerOrg: -1,
    maxContacts: -1,
    maxMeetingsPerMonth: -1,
    maxStorageGb: -1,
    includesCore: true,
    includesCommunication: true,
    includesIntelligence: true,
    includesOperations: true,
    includesExperimental: true,
    hasApiAccess: true,
    hasPrioritySupport: true,
    hasWhiteLabel: true,
    hasDedicatedAccount: true,
    hasCustomIntegrations: true,
    sortOrder: 3,
  },
];

for (const plan of plans) {
  const cols = Object.keys(plan);
  const placeholders = cols.map(() => "?").join(", ");
  const colNames = cols.map(c => {
    // Map JS keys to DB column names
    const map = {
      key: "planKey", name: "planName", description: "planDescription",
      tier: "planTier", priceMonthly: "planPriceMonthly", priceAnnual: "planPriceAnnual",
      currency: "planCurrency", maxOrganizations: "planMaxOrgs", maxUsersPerOrg: "planMaxUsersPerOrg",
      maxContacts: "planMaxContacts", maxMeetingsPerMonth: "planMaxMeetingsPerMonth",
      maxStorageGb: "planMaxStorageGb", includesCore: "planIncludesCore",
      includesCommunication: "planIncludesComm", includesIntelligence: "planIncludesIntel",
      includesOperations: "planIncludesOps", includesExperimental: "planIncludesExp",
      hasApiAccess: "planHasApi", hasPrioritySupport: "planHasPrioritySupport",
      hasWhiteLabel: "planHasWhiteLabel", hasDedicatedAccount: "planHasDedicatedAccount",
      hasCustomIntegrations: "planHasCustomIntegrations", sortOrder: "planSortOrder",
    };
    return map[c] || c;
  }).join(", ");
  const values = cols.map(c => plan[c]);

  try {
    await conn.execute(
      `INSERT INTO plans (${colNames}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE planName = VALUES(planName), planDescription = VALUES(planDescription)`,
      values
    );
    console.log(`✓ Seeded plan: ${plan.name}`);
  } catch (err) {
    console.error(`✗ Failed to seed plan ${plan.name}:`, err.message);
  }
}

// Seed plan features mapping
const featureKeys = [
  "meetings", "contacts", "companies", "tasks", "calendar",
  "email", "drive", "ai_insights", "branded_reports", "vault",
  "signing", "hr", "payroll",
];

const planFeatureMap = {
  starter: ["meetings", "contacts", "companies", "tasks", "calendar"],
  professional: ["meetings", "contacts", "companies", "tasks", "calendar", "email", "drive", "ai_insights", "branded_reports", "vault"],
  enterprise: featureKeys,
  sovereign: featureKeys,
};

// Get plan IDs
const [planRows] = await conn.execute("SELECT id, planKey FROM plans");
const planIdMap = {};
for (const row of planRows) {
  planIdMap[row.planKey] = row.id;
}

for (const [planKey, features] of Object.entries(planFeatureMap)) {
  const planId = planIdMap[planKey];
  if (!planId) continue;
  for (const fk of features) {
    try {
      await conn.execute(
        `INSERT INTO plan_features (pfPlanId, pfFeatureKey, pfIncluded) VALUES (?, ?, true) ON DUPLICATE KEY UPDATE pfIncluded = true`,
        [planId, fk]
      );
    } catch (err) {
      console.error(`✗ Failed to seed feature ${fk} for ${planKey}:`, err.message);
    }
  }
  console.log(`✓ Seeded ${features.length} features for ${planKey}`);
}

await conn.end();
console.log("\n✓ Plan seeding complete!");
