import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get Junaid
const [users] = await conn.query("SELECT id FROM users WHERE email = 'junaid@omniscopex.ae' LIMIT 1");
const userId = users[0]?.id;

if (!userId) {
  console.log("❌ User not found");
  await conn.end();
  process.exit(1);
}

// Create channel
const [ch] = await conn.query(`
  INSERT INTO channels (channelOrgId, channelType, channelName, channelDescription, channelCreatedBy)
  VALUES (NULL, 'group', 'OmniScope Core Team', 'Main team coordination', ?)
`, [userId]);

const cid = ch.insertId;

// Add member
await conn.query(`
  INSERT INTO channel_members (cmChannelId, cmUserId, cmRole)
  VALUES (?, ?, 'owner')
`, [cid, userId]);

// Add message
await conn.query(`
  INSERT INTO messages (msgChannelId, msgUserId, msgContent)
  VALUES (?, ?, 'Welcome to OmniScope Communications! 🚀')
`, [cid, userId]);

console.log(`✅ Channel ${cid} created`);
await conn.end();
