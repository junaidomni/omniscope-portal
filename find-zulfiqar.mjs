import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

// Find Zulfiqar meeting
const [zMeetings] = await conn.execute("SELECT id, meetingTitle FROM meetings WHERE meetingTitle LIKE '%Zulfiq%'");
console.log("Zulfiqar meetings:", JSON.stringify(zMeetings, null, 2));

// Find tasks linked to Zulfiqar meeting
if (zMeetings.length > 0) {
  const zId = zMeetings[0].id;
  const [zTasks] = await conn.execute("SELECT id, title FROM tasks WHERE meetingId = ?", [zId]);
  console.log("Zulfiqar tasks:", JSON.stringify(zTasks, null, 2));
}

// Count today's data
const [todayMeetings] = await conn.execute("SELECT COUNT(*) as cnt FROM meetings WHERE DATE(createdAt) = CURDATE()");
console.log("Today meetings:", todayMeetings[0].cnt);

const [todayTasks] = await conn.execute("SELECT COUNT(*) as cnt FROM tasks WHERE DATE(createdAt) = CURDATE()");
console.log("Today tasks:", todayTasks[0].cnt);

// Show a few today's meeting titles
const [mTitles] = await conn.execute("SELECT id, meetingTitle FROM meetings WHERE DATE(createdAt) = CURDATE() ORDER BY id LIMIT 5");
console.log("Sample today meetings:", JSON.stringify(mTitles, null, 2));

await conn.end();
