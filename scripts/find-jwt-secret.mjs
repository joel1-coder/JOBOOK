import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.qbuwdrshaucqddzajojw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'JoBook@2024#Secure',
  ssl: { rejectUnauthorized: false }
});

async function tryQuery(label, sql) {
  try {
    const res = await client.query(sql);
    if (res.rows.length > 0) {
      console.log(`✅ ${label}:`, JSON.stringify(res.rows));
      return res.rows;
    } else {
      console.log(`⬜ ${label}: no rows`);
    }
  } catch (e) {
    console.log(`❌ ${label}: ${e.message.slice(0, 80)}`);
  }
  return null;
}

async function run() {
  await client.connect();
  console.log('✅ Connected\n');

  // Search all schemas for anything JWT related
  await tryQuery('pg_settings jwt', `SELECT name, setting FROM pg_settings WHERE name LIKE '%jwt%' OR name LIKE '%secret%' OR name LIKE '%api_key%'`);
  await tryQuery('app.settings.jwt_secret', `SELECT current_setting('app.settings.jwt_secret')`);
  await tryQuery('vault secrets list', `SELECT id, name FROM vault.secrets`);
  await tryQuery('vault decrypted', `SELECT name, decrypted_secret FROM vault.decrypted_secrets WHERE name ILIKE '%jwt%' OR name ILIKE '%secret%' OR name ILIKE '%key%'`);
  
  // List all schemas
  await tryQuery('all schemas', `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')`);
  
  // Check supabase_migrations
  await tryQuery('supabase_migrations tables', `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('supabase_functions','supabase_migrations','storage','_analytics') ORDER BY table_schema`);

  // Check storage for any config
  await tryQuery('storage buckets', `SELECT * FROM storage.buckets LIMIT 5`);

  // Check if there's a config table anywhere
  await tryQuery('config tables', `SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%config%' OR table_name ILIKE '%setting%' OR table_name ILIKE '%secret%'`);
  
  // Try to read environment via pg_read_file (probably blocked)
  await tryQuery('env file', `SELECT pg_read_file('/etc/postgresql/postgresql.conf') LIMIT 1`);

  await client.end();
}

run().catch(e => { console.error('Fatal:', e.message); client.end().catch(() => {}); });
