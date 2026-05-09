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

async function run() {
  await client.connect();
  console.log('✅ Connected\n');

  const fixes = [
    // Fix rooms — use auth.uid() IS NOT NULL instead of auth.role()
    { name: 'Drop old rooms select policy', sql: `DROP POLICY IF EXISTS "Auth users view rooms" ON rooms` },
    { name: 'New rooms select policy', sql: `CREATE POLICY "Authenticated users can view rooms" ON rooms FOR SELECT USING (auth.uid() IS NOT NULL)` },

    // Fix time_slots
    { name: 'Drop old slots select policy', sql: `DROP POLICY IF EXISTS "Auth users view slots" ON time_slots` },
    { name: 'New slots select policy', sql: `CREATE POLICY "Authenticated users can view slots" ON time_slots FOR SELECT USING (auth.uid() IS NOT NULL)` },

    // Fix booking_rules read
    { name: 'Drop old rules read policy', sql: `DROP POLICY IF EXISTS "Auth users read rules" ON booking_rules` },
    { name: 'New rules read policy', sql: `CREATE POLICY "Authenticated users can read rules" ON booking_rules FOR SELECT USING (auth.uid() IS NOT NULL)` },

    // Also allow users to INSERT bookings properly
    { name: 'Drop old booking insert policy', sql: `DROP POLICY IF EXISTS "Users create bookings" ON bookings` },
    { name: 'New booking insert policy', sql: `CREATE POLICY "Users create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid())` },

    // Fix profiles - allow users to read their own
    { name: 'Drop old profiles read policy', sql: `DROP POLICY IF EXISTS "Users read own profile" ON profiles` },
    { name: 'New profiles read policy', sql: `CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL AND id = auth.uid())` },
  ];

  for (const fix of fixes) {
    try {
      await client.query(fix.sql);
      console.log(`✅ ${fix.name}`);
    } catch (e) {
      console.error(`❌ ${fix.name}: ${e.message.slice(0, 100)}`);
    }
  }

  // Verify rooms are readable
  const rooms = await client.query('SELECT name, available FROM rooms ORDER BY name');
  console.log('\n🏢 Rooms in DB:');
  console.table(rooms.rows);

  const slots = await client.query('SELECT label, active FROM time_slots ORDER BY label');
  console.log('\n🕐 Time slots in DB:');
  console.table(slots.rows);

  await client.end();
  console.log('\n✅ RLS policies fixed!');
}

run().catch(e => { console.error('Fatal:', e.message); client.end().catch(() => {}); });
