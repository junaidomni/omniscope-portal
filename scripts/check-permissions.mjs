import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [users] = await conn.execute(`
  SELECT u.id, u.name, u.email, u.role as user_role, u.platformOwner, 
         om.omRole as org_role, o.orgName as org_name, o.id as org_id,
         a.accountName as account_name, a.id as account_id, a.accountStatus as account_status,
         p.planKey, p.planPriceMonthly as monthlyPrice
  FROM users u 
  LEFT JOIN org_memberships om ON u.id = om.omUserId 
  LEFT JOIN organizations o ON om.omOrgId = o.id
  LEFT JOIN accounts a ON o.orgAccountId = a.id
  LEFT JOIN subscriptions s ON a.id = s.subAccountId
  LEFT JOIN plans p ON s.subPlanId = p.id
  ORDER BY u.id
`);

console.log("\n=== USER PERMISSIONS & ACCESS LEVELS ===\n");
for (const u of users) {
  const canAccessAdminHub = u.user_role === 'admin' || u.org_role === 'super_admin' || u.org_role === 'account_owner';
  const canAccessPlatform = u.platformOwner === 1;
  const canAccessAccount = u.org_role === 'account_owner' || u.org_role === 'super_admin';
  
  console.log(`${u.name} (${u.email})`);
  console.log(`  User Role: ${u.user_role} | Platform Owner: ${u.platformOwner ? 'YES' : 'NO'}`);
  console.log(`  Org: ${u.org_name || 'NONE'} | Org Role: ${u.org_role || 'NONE'}`);
  console.log(`  Account: ${u.account_name || 'NONE'} | Plan: ${u.planKey || 'NONE'} | MRR: $${u.monthlyPrice || 0}`);
  console.log(`  Access: Admin Hub=${canAccessAdminHub ? 'YES' : 'NO'} | Platform=${canAccessPlatform ? 'YES' : 'NO'} | Account Console=${canAccessAccount ? 'YES' : 'NO'}`);
  console.log(`  Sidebar Links: Settings, HR Hub, Account${u.user_role === 'admin' ? ', Admin' : ''}${canAccessPlatform ? ', Platform' : ''}`);
  console.log('');
}

// Check plan limits
const [plans] = await conn.execute(`
  SELECT planKey, planPriceMonthly as monthlyPrice, planPriceAnnual as annualPrice,
         planMaxOrgs, planMaxUsersPerOrg, planMaxContacts, planMaxMeetingsPerMonth, planMaxStorageGb
  FROM plans
  ORDER BY planPriceMonthly
`);

console.log("\n=== PLAN LIMITS ===\n");
for (const p of plans) {
  const fmt = (v) => v === -1 ? 'Unlimited' : v;
  console.log(`${p.planKey.toUpperCase()} ($${p.monthlyPrice}/mo, $${p.annualPrice}/yr):`);
  console.log(`  Max Orgs: ${fmt(p.planMaxOrgs)}`);
  console.log(`  Users/Org: ${fmt(p.planMaxUsersPerOrg)}`);
  console.log(`  Contacts: ${fmt(p.planMaxContacts)}`);
  console.log(`  Meetings/Mo: ${fmt(p.planMaxMeetingsPerMonth)}`);
  console.log(`  Storage (GB): ${fmt(p.planMaxStorageGb)}`);
  console.log('');
}

await conn.end();
