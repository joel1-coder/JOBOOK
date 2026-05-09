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

const newEmail = process.argv[2] || 'admin2@jobook.com';
const newPassword = process.argv[3] || 'Admin@2024';
const newName = process.argv[4] || 'Second Admin';

async function run() {
  try {
    console.log(`Adding new admin: ${newEmail}`);
    await client.connect();

    const createSql = `
      DO $body$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '${newEmail}') THEN
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
            '${newEmail}',
            crypt('${newPassword}', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"${newName}"}'::jsonb,
            now(), now(), '', '', '', ''
          );
        END IF;
      END $body$;
    `;
    
    await client.query(createSql);
    console.log('✅ User inserted into auth.users');

    // Make sure trigger had time to run
    await new Promise(r => setTimeout(r, 1000));

    await client.query(`UPDATE profiles SET role = 'admin' WHERE email = '${newEmail}';`);
    console.log('✅ User promoted to admin in profiles table');

    await client.end();
    console.log('\n🎉 Admin account successfully created!');
    console.log(`Email: ${newEmail}`);
    console.log(`Password: ${newPassword}`);
  } catch (err) {
    console.error('❌ Fatal:', err.message);
    await client.end().catch(() => {});
  }
}

run();
