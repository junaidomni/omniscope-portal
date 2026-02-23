import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get Junaid's user ID
const [junaid] = await connection.query("SELECT id FROM users WHERE email = 'junaid@omniscopex.ae' LIMIT 1");
const junaidId = junaid[0]?.id;

if (!junaidId) {
  console.log("❌ Junaid not found");
  await connection.end();
  process.exit(1);
}

// Create a test group channel
const [channelResult] = await connection.query(`
  INSERT INTO channels (channelOrgId, channelType, channelName, channelDescription, channelCreatedBy, channelCreatedAt)
  VALUES (NULL, 'group', 'OmniScope Core Team', 'Main team coordination channel', ?, NOW())
`, [junaidId]);

const channelId = channelResult.insertId;

// Add Junaid as owner
await connection.query(`
  INSERT INTO channelMembers (memberChannelId, memberUserId, memberRole, memberJoinedAt)
  VALUES (?, ?, 'owner', NOW())
`, [channelId, junaidId]);

// Add a welcome message
await connection.query(`
  INSERT INTO messages (msgChannelId, msgUserId, msgContent, msgCreatedAt)
  VALUES (?, ?, 'Welcome to OmniScope Communications! 🚀', NOW())
`, [channelId, junaidId]);

console.log(`✅ Created test channel ID: ${channelId}`);
console.log(`✅ Added Junaid as owner`);
console.log(`✅ Added welcome message`);

await connection.end();
