import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(import.meta.dirname, '..', '.env');
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
} catch(e) {}

const apiKey = process.env.FATHOM_API_KEY;
console.log('API Key present:', !!apiKey);

const resp = await fetch('https://api.fathom.ai/external/v1/meetings?limit=5&include_transcript=false&include_summary=false&include_action_items=false', {
  headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' }
});
const data = await resp.json();
const hassan = data.items?.find(m => m.title?.includes('Hassan'));
if (hassan) {
  console.log('=== Hassan x Jake Meeting ===');
  console.log('Title:', hassan.title);
  console.log('Recording ID:', hassan.recording_id);
  console.log('Scheduled start:', hassan.scheduled_start_time);
  console.log('Scheduled end:', hassan.scheduled_end_time);
  console.log('Recording start:', hassan.recording_start_time);
  console.log('Recording end:', hassan.recording_end_time);
  console.log('Calendar invitees:', JSON.stringify(hassan.calendar_invitees, null, 2));
  console.log('Recorded by:', JSON.stringify(hassan.recorded_by, null, 2));
} else {
  console.log('Meeting not found. Titles:', data.items?.map(m => m.title));
}
