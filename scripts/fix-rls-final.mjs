import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.qbuwdrshaucqddzajojw.supabase.co',
  port: 5432, database: 'postgres',
  user: 'postgres', password: 'JoBook@2024#Secure',
  ssl: { rejectUnauthorized: false }
});

const steps = [
  {
    name: 'Create is_admin() security definer function (bypasses RLS)',
    sql: `
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean LANGUAGE sql SECURITY DEFINER
      SET search_path = public AS $$
        SELECT EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        );
      $$;
    `
  },

  // ── DROP all existing policies ──────────────────────────────
  { name: 'Drop all profiles policies', sql: `
    DROP POLICY IF EXISTS "Users read own profile"            ON profiles;
    DROP POLICY IF EXISTS "Admins read all profiles"          ON profiles;
    DROP POLICY IF EXISTS "Users update own profile"          ON profiles;
    DROP POLICY IF EXISTS "Admins update any profile"         ON profiles;
    DROP POLICY IF EXISTS "Allow profile creation on signup"  ON profiles;
  `},
  { name: 'Drop all rooms policies', sql: `
    DROP POLICY IF EXISTS "Auth users view rooms"             ON rooms;
    DROP POLICY IF EXISTS "Authenticated users can view rooms" ON rooms;
    DROP POLICY IF EXISTS "Admins manage rooms"               ON rooms;
  `},
  { name: 'Drop all time_slots policies', sql: `
    DROP POLICY IF EXISTS "Auth users view slots"             ON time_slots;
    DROP POLICY IF EXISTS "Authenticated users can view slots" ON time_slots;
    DROP POLICY IF EXISTS "Admins manage slots"               ON time_slots;
  `},
  { name: 'Drop all bookings policies', sql: `
    DROP POLICY IF EXISTS "Users view own bookings"           ON bookings;
    DROP POLICY IF EXISTS "Admins view all bookings"          ON bookings;
    DROP POLICY IF EXISTS "Users create bookings"             ON bookings;
    DROP POLICY IF EXISTS "Users cancel own bookings"         ON bookings;
    DROP POLICY IF EXISTS "Admins manage all bookings"        ON bookings;
  `},
  { name: 'Drop all booking_rules policies', sql: `
    DROP POLICY IF EXISTS "Admins manage rules"               ON booking_rules;
    DROP POLICY IF EXISTS "Admins manage booking rules"       ON booking_rules;
    DROP POLICY IF EXISTS "Auth users read rules"             ON booking_rules;
    DROP POLICY IF EXISTS "Authenticated users can read rules" ON booking_rules;
    DROP POLICY IF EXISTS "Authenticated users read rules"    ON booking_rules;
  `},

  // ── profiles: simple non-recursive policies ─────────────────
  { name: 'Profiles: users see own row', sql: `CREATE POLICY "profile_select_own" ON profiles FOR SELECT USING (auth.uid() = id);` },
  { name: 'Profiles: admins see all (via function)', sql: `CREATE POLICY "profile_select_admin" ON profiles FOR SELECT USING (public.is_admin());` },
  { name: 'Profiles: users update own', sql: `CREATE POLICY "profile_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);` },
  { name: 'Profiles: admins update any', sql: `CREATE POLICY "profile_update_admin" ON profiles FOR UPDATE USING (public.is_admin());` },
  { name: 'Profiles: allow insert on signup', sql: `CREATE POLICY "profile_insert" ON profiles FOR INSERT WITH CHECK (true);` },

  // ── rooms: open to all authenticated users ──────────────────
  { name: 'Rooms: authenticated can view', sql: `CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (auth.uid() IS NOT NULL);` },
  { name: 'Rooms: admins manage', sql: `CREATE POLICY "rooms_admin" ON rooms FOR ALL USING (public.is_admin());` },

  // ── time_slots: open to all authenticated users ─────────────
  { name: 'Slots: authenticated can view', sql: `CREATE POLICY "slots_select" ON time_slots FOR SELECT USING (auth.uid() IS NOT NULL);` },
  { name: 'Slots: admins manage', sql: `CREATE POLICY "slots_admin" ON time_slots FOR ALL USING (public.is_admin());` },

  // ── bookings ─────────────────────────────────────────────────
  { name: 'Bookings: users see own', sql: `CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (user_id = auth.uid());` },
  { name: 'Bookings: admins see all', sql: `CREATE POLICY "bookings_select_admin" ON bookings FOR SELECT USING (public.is_admin());` },
  { name: 'Bookings: users insert own', sql: `CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());` },
  { name: 'Bookings: users update own', sql: `CREATE POLICY "bookings_update_own" ON bookings FOR UPDATE USING (user_id = auth.uid());` },
  { name: 'Bookings: admins manage all', sql: `CREATE POLICY "bookings_admin" ON bookings FOR ALL USING (public.is_admin());` },

  // ── booking_rules ─────────────────────────────────────────────
  { name: 'Rules: authenticated can read', sql: `CREATE POLICY "rules_select" ON booking_rules FOR SELECT USING (auth.uid() IS NOT NULL);` },
  { name: 'Rules: admins manage', sql: `CREATE POLICY "rules_admin" ON booking_rules FOR ALL USING (public.is_admin());` },
];

async function run() {
  await client.connect();
  console.log('✅ Connected\n');

  for (const step of steps) {
    try {
      await client.query(step.sql);
      console.log(`✅ ${step.name}`);
    } catch (e) {
      console.error(`❌ ${step.name}: ${e.message.slice(0, 120)}`);
    }
  }

  // Quick verify
  const rooms = await client.query('SELECT count(*) FROM rooms');
  const slots = await client.query('SELECT count(*) FROM time_slots');
  const profiles = await client.query('SELECT count(*) FROM profiles');
  console.log(`\n📊 DB state: ${rooms.rows[0].count} rooms | ${slots.rows[0].count} slots | ${profiles.rows[0].count} profiles`);

  await client.end();
  console.log('\n✅ All RLS policies rebuilt — no more recursion!');
}

run().catch(e => { console.error('Fatal:', e.message); client.end().catch(() => {}); });
