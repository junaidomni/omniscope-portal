/**
 * Provision Test Accounts — One per Plan Tier
 * 
 * Creates test users and accounts for Starter, Professional, Enterprise, and Sovereign plans.
 * Each gets a user, account, organization, org membership, and subscription.
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and } from "drizzle-orm";

// We need to read schema dynamically
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Direct SQL approach since we can't easily import TS schema from mjs
const testAccounts = [
  {
    userName: "Sarah Chen",
    userEmail: "sarah.chen@testclient.com",
    accountName: "Chen Capital Partners",
    orgName: "Chen Capital",
    orgSlug: "chen-capital",
    plan: "starter",
    billingEmail: "billing@chencapital.com",
    mrrCents: 49900,  // $499
    industry: "Financial Services",
  },
  {
    userName: "Marcus Webb",
    userEmail: "marcus@webbventures.com",
    accountName: "Webb Ventures Group",
    orgName: "Webb Ventures",
    orgSlug: "webb-ventures",
    plan: "professional",
    billingEmail: "finance@webbventures.com",
    mrrCents: 99900,  // $999
    industry: "Investment Management",
  },
  {
    userName: "Fatima Al-Rashid",
    userEmail: "fatima@alrashid-holdings.ae",
    accountName: "Al-Rashid Holdings",
    orgName: "Al-Rashid Holdings",
    orgSlug: "alrashid-holdings",
    plan: "enterprise",
    billingEmail: "accounts@alrashid-holdings.ae",
    mrrCents: 199900,  // $1,999
    industry: "Real Estate & Commodities",
  },
  {
    userName: "James Whitfield",
    userEmail: "james@whitfield-sovereign.com",
    accountName: "Whitfield Sovereign Trust",
    orgName: "Whitfield Trust",
    orgSlug: "whitfield-trust",
    plan: "sovereign",
    billingEmail: "treasury@whitfield-sovereign.com",
    mrrCents: 0,  // Custom
    industry: "Family Office",
  },
];

console.log("=== Provisioning Test Accounts ===\n");

for (const ta of testAccounts) {
  console.log(`--- ${ta.plan.toUpperCase()}: ${ta.accountName} ---`);
  
  // 1. Check if user already exists
  const [existingUsers] = await connection.query(
    "SELECT id FROM users WHERE email = ?",
    [ta.userEmail]
  );
  
  let userId;
  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    console.log(`  User already exists (id: ${userId})`);
  } else {
    // Create user
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, role, platformOwner, openId) VALUES (?, ?, 'user', false, ?)`,
      [ta.userName, ta.userEmail, `test-${ta.plan}-${Date.now()}`]
    );
    userId = userResult.insertId;
    console.log(`  Created user (id: ${userId})`);
  }
  
  // 2. Check if account already exists for this user
  const [existingAccounts] = await connection.query(
    "SELECT id FROM accounts WHERE accountOwnerUserId = ?",
    [userId]
  );
  
  let accountId;
  if (existingAccounts.length > 0) {
    accountId = existingAccounts[0].id;
    console.log(`  Account already exists (id: ${accountId})`);
    // Update plan and MRR
    await connection.query(
      "UPDATE accounts SET accountPlan = ?, accountMrrCents = ?, accountBillingEmail = ? WHERE id = ?",
      [ta.plan, ta.mrrCents, ta.billingEmail, accountId]
    );
    console.log(`  Updated account plan to ${ta.plan}`);
  } else {
    // Create account
    const [accountResult] = await connection.query(
      `INSERT INTO accounts (accountName, accountOwnerUserId, accountPlan, accountStatus, accountBillingEmail, accountMrrCents, accountHealthScore) 
       VALUES (?, ?, ?, 'active', ?, ?, 100)`,
      [ta.accountName, userId, ta.plan, ta.billingEmail, ta.mrrCents]
    );
    accountId = accountResult.insertId;
    console.log(`  Created account (id: ${accountId})`);
  }
  
  // 3. Check if org already exists
  const [existingOrgs] = await connection.query(
    "SELECT id FROM organizations WHERE orgAccountId = ? AND orgSlug = ?",
    [accountId, ta.orgSlug]
  );
  
  let orgId;
  if (existingOrgs.length > 0) {
    orgId = existingOrgs[0].id;
    console.log(`  Organization already exists (id: ${orgId})`);
  } else {
    // Create organization
    const [orgResult] = await connection.query(
      `INSERT INTO organizations (orgAccountId, orgName, orgSlug, orgIndustry) VALUES (?, ?, ?, ?)`,
      [accountId, ta.orgName, ta.orgSlug, ta.industry]
    );
    orgId = orgResult.insertId;
    console.log(`  Created organization (id: ${orgId})`);
  }
  
  // 4. Check if membership already exists
  const [existingMemberships] = await connection.query(
    "SELECT id FROM org_memberships WHERE omUserId = ? AND omOrgId = ?",
    [userId, orgId]
  );
  
  if (existingMemberships.length > 0) {
    console.log(`  Membership already exists`);
  } else {
    // Add org membership as account_owner
    await connection.query(
      `INSERT INTO org_memberships (omUserId, omOrgId, omRole, omIsDefault) VALUES (?, ?, 'account_owner', true)`,
      [userId, orgId]
    );
    console.log(`  Created org membership (account_owner)`);
  }
  
  // 5. Get plan ID
  const [planRows] = await connection.query(
    "SELECT id FROM plans WHERE planKey = ?",
    [ta.plan]
  );
  
  if (planRows.length > 0) {
    const planId = planRows[0].id;
    
    // Check if subscription already exists
    const [existingSubs] = await connection.query(
      "SELECT id FROM subscriptions WHERE subAccountId = ?",
      [accountId]
    );
    
    if (existingSubs.length > 0) {
      // Update existing subscription
      await connection.query(
        "UPDATE subscriptions SET subPlanId = ?, subStatus = 'active' WHERE subAccountId = ?",
        [planId, accountId]
      );
      console.log(`  Updated subscription to ${ta.plan} plan`);
    } else {
      // Create subscription
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await connection.query(
        `INSERT INTO subscriptions (subAccountId, subPlanId, subStatus, subBillingCycle, subStartDate) 
         VALUES (?, ?, 'active', 'monthly', ?)`,
        [accountId, planId, now]
      );
      console.log(`  Created subscription (${ta.plan} plan, monthly)`);
    }
  } else {
    console.log(`  WARNING: Plan '${ta.plan}' not found in plans table`);
  }
  
  console.log(`  ✓ ${ta.accountName} provisioned on ${ta.plan} plan\n`);
}

// Summary
console.log("=== Summary ===");
const [allAccounts] = await connection.query(
  `SELECT a.id, a.accountName, a.accountPlan, a.accountStatus, a.accountMrrCents, u.name as ownerName, u.email as ownerEmail
   FROM accounts a JOIN users u ON a.accountOwnerUserId = u.id ORDER BY a.id`
);
console.table(allAccounts);

const [allSubs] = await connection.query(
  `SELECT s.id, s.subAccountId as accountId, p.planName, s.subStatus as status, s.subBillingCycle as billingCycle 
   FROM subscriptions s JOIN plans p ON s.subPlanId = p.id ORDER BY s.id`
);
console.table(allSubs);

const [allOrgs] = await connection.query(
  `SELECT o.id, o.orgAccountId as accountId, o.orgName as name, o.orgSlug as slug, o.orgIndustry as industry FROM organizations o ORDER BY o.id`
);
console.table(allOrgs);

await connection.end();
console.log("\n✓ All test accounts provisioned successfully!");
