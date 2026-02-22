import { createConnection } from 'mysql2/promise';
import { SignJWT } from 'jose';

const conn = await createConnection(process.env.DATABASE_URL);

// Get all test users and Junaid
const [users] = await conn.execute(
  'SELECT id, name, email, openId FROM users WHERE id IN (1, 2670483, 2670487, 2670488, 2670489)'
);

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const appId = process.env.VITE_APP_ID;

for (const user of users) {
  const token = await new SignJWT({ openId: user.openId, appId, name: user.name || '' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('4h')
    .sign(secret);
  console.log(`\n${user.name} (ID: ${user.id}, ${user.email}):`);
  console.log(`  openId: ${user.openId}`);
  console.log(`  token: ${token}`);
}

await conn.end();
