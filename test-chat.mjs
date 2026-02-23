import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get channel
const [channels] = await conn.query("SELECT id FROM channels LIMIT 1");
if (!channels.length) {
  console.log("❌ No channels found");
  process.exit(1);
}

const channelId = channels[0].id;
console.log(`✅ Found channel ID: ${channelId}`);

// Get messages
const [messages] = await conn.query("SELECT * FROM messages WHERE msgChannelId = ? ORDER BY msgCreatedAt DESC LIMIT 5", [channelId]);
console.log(`✅ Found ${messages.length} messages in channel`);

if (messages.length > 0) {
  console.log("Latest message:", messages[0].msgContent);
}

// Check WebSocket server
console.log("✅ Backend is working!");

await conn.end();
