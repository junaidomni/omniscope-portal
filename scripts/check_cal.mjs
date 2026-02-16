import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';

// Load env
const envPath = new URL('../.env', import.meta.url).pathname;
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx);
      const val = trimmed.substring(eqIdx + 1).replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
} catch(e) { console.error('Failed to load .env:', e.message); }

const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query("SELECT id, summary, startTime, endTime, googleEventId, attendees FROM calendar_events WHERE summary LIKE '%Hassan%' OR summary LIKE '%Jake%' ORDER BY id DESC LIMIT 5");
console.log(JSON.stringify(rows, null, 2));
await conn.end();
