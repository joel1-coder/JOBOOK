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
    await client.connect();

    const sql = `
      -- Function to create a user securely from the dashboard
      CREATE OR REPLACE FUNCTION admin_create_user(
        new_email TEXT,
        new_password TEXT,
        new_full_name TEXT,
        new_department TEXT
      ) RETURNS uuid
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
      DECLARE
        new_id uuid;
      BEGIN
        -- Check if admin
        IF NOT public.is_admin() THEN
          RAISE EXCEPTION 'Access denied';
        END IF;

        new_id := gen_random_uuid();
        
        -- Insert into auth.users
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, confirmation_token,
          email_change, email_change_token_new, recovery_token
        ) VALUES (
          new_id,
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          new_email,
          crypt(new_password, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('full_name', new_full_name),
          now(), now(), '', '', '', ''
        );

        -- The trigger will automatically create the profile, so we just update it
        UPDATE public.profiles 
        SET department = new_department, full_name = new_full_name
        WHERE id = new_id;

        RETURN new_id;
      END;
      $$;

      -- Function to delete a user securely
      CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
      RETURNS void
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
      BEGIN
        IF NOT public.is_admin() THEN
          RAISE EXCEPTION 'Access denied';
        END IF;

        -- Delete from auth.users (cascades to profiles)
        DELETE FROM auth.users WHERE id = target_user_id;
      END;
      $$;
    `;

    await client.query(sql);
    console.log('✅ Added admin_create_user and admin_delete_user RPCs');

  } catch (err) {
    console.error('❌ Fatal:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
