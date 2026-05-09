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
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');

    const steps = [
      {
        name: 'Add INSERT policy for profiles',
        sql: `
          DO $body$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename='profiles'
              AND policyname='Allow profile creation on signup'
            ) THEN
              CREATE POLICY "Allow profile creation on signup"
                ON profiles FOR INSERT WITH CHECK (true);
            END IF;
          END $body$;
        `
      },
      {
        name: 'Fix handle_new_user trigger function',
        sql: `
          CREATE OR REPLACE FUNCTION handle_new_user()
          RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
          SET search_path = public AS $func$
          BEGIN
            INSERT INTO profiles (id, full_name, email)
            VALUES (
              NEW.id,
              COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email,'@',1)),
              NEW.email
            )
            ON CONFLICT (id) DO NOTHING;
            RETURN NEW;
          EXCEPTION WHEN OTHERS THEN
            RETURN NEW;
          END;
          $func$;
        `
      },
      {
        name: 'Recreate trigger',
        sql: `
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
        `
      },
      {
        name: 'Create admin user in auth.users',
        sql: `
          DO $body$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@jobook.com') THEN
              INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                created_at, updated_at, confirmation_token,
                email_change, email_change_token_new, recovery_token
              ) VALUES (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000000',
                'authenticated',
                'authenticated',
                'admin@jobook.com',
                crypt('Admin@2024', gen_salt('bf')),
                now(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{"full_name":"Admin User"}'::jsonb,
                now(), now(), '', '', '', ''
              );
            END IF;
          END $body$;
        `
      },
      {
        name: 'Create regular user in auth.users',
        sql: `
          DO $body$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user@jobook.com') THEN
              INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                created_at, updated_at, confirmation_token,
                email_change, email_change_token_new, recovery_token
              ) VALUES (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000000',
                'authenticated',
                'authenticated',
                'user@jobook.com',
                crypt('User@2024', gen_salt('bf')),
                now(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{"full_name":"Joel User"}'::jsonb,
                now(), now(), '', '', '', ''
              );
            END IF;
          END $body$;
        `
      },
      {
        name: 'Promote admin role',
        sql: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@jobook.com';`
      }
    ];

    for (const step of steps) {
      try {
        await client.query(step.sql);
        console.log(`✅ ${step.name}`);
      } catch (err) {
        console.error(`❌ ${step.name}: ${err.message}`);
      }
    }

    // Verify profiles
    const profiles = await client.query('SELECT email, role, status FROM profiles ORDER BY created_at');
    console.log('\n📋 Profiles in database:');
    if (profiles.rows.length === 0) {
      console.log('  (empty — trigger may need a moment. Check Supabase Auth > Users dashboard)');
    } else {
      console.table(profiles.rows);
    }

    // Verify auth users
    const users = await client.query("SELECT email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users ORDER BY created_at");
    console.log('\n👤 Auth users in database:');
    console.table(users.rows);

    await client.end();
    console.log('\n✅ Setup complete!');
  } catch (err) {
    console.error('❌ Fatal:', err.message);
    await client.end().catch(() => {});
  }
}

run();
