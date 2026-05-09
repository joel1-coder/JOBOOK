import pg from 'pg';
import crypto from 'crypto';
const { Client } = pg;

const client = new Client({
  host: 'db.qbuwdrshaucqddzajojw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'JoBook@2024#Secure',
  ssl: { rejectUnauthorized: false }
});

// Build a JWT manually using HMAC-SHA256
function base64urlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createJWT(payload, secret) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.${sig}`;
}

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to DB\n');

    // Try to get the JWT secret from Supabase settings
    let jwtSecret = null;

    const queries = [
      "SELECT current_setting('app.settings.jwt_secret', true) as secret",
      "SELECT decrypted_secret as secret FROM vault.decrypted_secrets WHERE name = 'jwt_secret' LIMIT 1",
      "SELECT value as secret FROM app_settings WHERE key = 'jwt_secret' LIMIT 1",
    ];

    for (const q of queries) {
      try {
        const res = await client.query(q);
        if (res.rows[0]?.secret) {
          jwtSecret = res.rows[0].secret;
          console.log('✅ Found JWT secret via:', q.slice(0, 50));
          break;
        }
      } catch (e) {
        // try next
      }
    }

    if (!jwtSecret) {
      console.log('❌ Could not retrieve JWT secret from DB');
      console.log('\n👉 Manual step needed — see instructions below');
    } else {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + (10 * 365 * 24 * 3600); // 10 years

      const anonKey = createJWT({
        role: 'anon',
        iss: 'supabase',
        iat: now,
        exp: exp,
      }, jwtSecret);

      const serviceKey = createJWT({
        role: 'service_role',
        iss: 'supabase',
        iat: now,
        exp: exp,
      }, jwtSecret);

      console.log('\n✅ ANON KEY:');
      console.log(anonKey);
      console.log('\n✅ SERVICE ROLE KEY:');
      console.log(serviceKey);

      // Write to .env file
      const { writeFileSync } = await import('fs');
      const envContent = `VITE_SUPABASE_URL=https://qbuwdrshaucqddzajojw.supabase.co\nVITE_SUPABASE_ANON_KEY=${anonKey}\n`;
      writeFileSync('c:\\JOBOOK\\.env', envContent);
      console.log('\n✅ .env file updated with correct anon key!');
    }

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end().catch(() => {});
  }
}

run();
