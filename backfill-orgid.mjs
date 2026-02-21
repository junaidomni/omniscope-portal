import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// All tables with their orgId column names that need backfilling
const tablesToBackfill = [
  { table: 'meetings', col: 'mtgOrgId' },
  { table: 'contacts', col: 'contactOrgId' },
  { table: 'tasks', col: 'taskOrgId' },
  { table: 'companies', col: 'orgId' },
  { table: 'employees', col: 'empOrgId' },
  { table: 'documents', col: 'docOrgId' },
  { table: 'activity_log', col: 'alOrgId' },
  { table: 'calendar_events', col: 'ceOrgId' },
  { table: 'company_aliases', col: 'coaOrgId' },
  { table: 'contact_aliases', col: 'caOrgId' },
  { table: 'contact_documents', col: 'cdOrgId' },
  { table: 'contact_notes', col: 'cnOrgId' },
  { table: 'document_access', col: 'daOrgId' },
  { table: 'document_entity_links', col: 'delOrgId' },
  { table: 'document_favorites', col: 'dfavOrgId' },
  { table: 'document_folders', col: 'dfOrgId' },
  { table: 'document_notes', col: 'noteOrgId' },
  { table: 'document_templates', col: 'dtOrgId' },
  { table: 'email_company_links', col: 'eclOrgId' },
  { table: 'email_entity_links', col: 'eelOrgId' },
  { table: 'email_messages', col: 'emOrgId' },
  { table: 'email_stars', col: 'esOrgId' },
  { table: 'email_thread_summaries', col: 'etsOrgId' },
  { table: 'feature_toggles', col: 'ftOrgId' },
  { table: 'hr_documents', col: 'hrOrgId' },
  { table: 'integrations', col: 'intOrgId' },
  { table: 'interactions', col: 'intxOrgId' },
  { table: 'meeting_categories', col: 'mcOrgId' },
  { table: 'meeting_contacts', col: 'mcOrgId' },
  { table: 'meeting_tags', col: 'mtOrgId' },
  { table: 'payroll_records', col: 'prOrgId' },
  { table: 'pending_suggestions', col: 'psOrgId' },
  { table: 'signing_envelopes', col: 'seOrgId' },
  { table: 'signing_providers', col: 'spOrgId' },
  { table: 'tags', col: 'tagOrgId' },
];

const ORG_ID = 1; // The only org that exists

console.log(`Backfilling all tables with orgId = ${ORG_ID}...\n`);

let totalUpdated = 0;
for (const { table, col } of tablesToBackfill) {
  try {
    const [result] = await conn.query(
      `UPDATE ${table} SET ${col} = ? WHERE ${col} IS NULL`,
      [ORG_ID]
    );
    const count = result.affectedRows;
    if (count > 0) {
      console.log(`✅ ${table}.${col}: ${count} rows updated`);
      totalUpdated += count;
    } else {
      console.log(`⏭️  ${table}.${col}: no null rows`);
    }
  } catch (e) {
    console.log(`❌ ${table}.${col}: ${e.message}`);
  }
}

console.log(`\n🎯 Total rows backfilled: ${totalUpdated}`);

// Verify meetings now have orgId
const [meetings] = await conn.query('SELECT COUNT(*) as cnt FROM meetings WHERE mtgOrgId = ?', [ORG_ID]);
console.log(`\nVerification - Meetings with orgId=${ORG_ID}: ${meetings[0].cnt}`);

const [contacts] = await conn.query('SELECT COUNT(*) as cnt FROM contacts WHERE contactOrgId = ?', [ORG_ID]);
console.log(`Verification - Contacts with orgId=${ORG_ID}: ${contacts[0].cnt}`);

const [tasks] = await conn.query('SELECT COUNT(*) as cnt FROM tasks WHERE taskOrgId = ?', [ORG_ID]);
console.log(`Verification - Tasks with orgId=${ORG_ID}: ${tasks[0].cnt}`);

await conn.end();
