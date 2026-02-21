import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const tables = [
  { name: 'meetings', col: 'mtgOrgId' },
  { name: 'contacts', col: 'contactOrgId' },
  { name: 'tasks', col: 'taskOrgId' },
  { name: 'companies', col: 'orgId' },
  { name: 'employees', col: 'empOrgId' },
  { name: 'documents', col: 'docOrgId' },
  { name: 'activity_log', col: 'actOrgId' },
  { name: 'directory_entries', col: 'dirOrgId' },
  { name: 'suggestions', col: 'sugOrgId' },
  { name: 'interactions', col: 'intOrgId' },
  { name: 'integrations', col: 'intgOrgId' },
  { name: 'email_messages', col: 'emailOrgId' },
];

for (const t of tables) {
  try {
    const [rows] = await conn.query(`SELECT COUNT(*) as total, SUM(CASE WHEN ${t.col} IS NULL THEN 1 ELSE 0 END) as null_org, SUM(CASE WHEN ${t.col} IS NOT NULL THEN 1 ELSE 0 END) as has_org FROM ${t.name}`);
    console.log(`${t.name}: total=${rows[0].total}, null_org=${rows[0].null_org}, has_org=${rows[0].has_org}`);
  } catch(e) {
    console.log(`${t.name}: ERROR - ${e.message}`);
  }
}

// Also check what orgs exist
const [orgs] = await conn.query('SELECT id, name FROM organizations');
console.log('\nOrganizations:', orgs);

await conn.end();
