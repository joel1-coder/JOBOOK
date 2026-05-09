// Quick test: verify Supabase anon key works
const SUPABASE_URL = 'https://qbuwdrshaucqddzajojw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidXdkcnNoYXVjcWRkemFqb2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDg2NjAsImV4cCI6MjA5Mzg4NDY2MH0.iJnzrnGqzQo55ET6eBdXBkTdviyV14oFE93oNaKMBoE';

async function test() {
  console.log('Testing Supabase connection...\n');

  // Test 1: Auth health check
  const health = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  console.log(`Auth health: ${health.status} ${health.ok ? '✅' : '❌'}`);

  // Test 2: Try sign in with admin
  const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'admin@jobook.com', password: 'Admin@2024' })
  });
  const loginData = await login.json();

  if (login.ok) {
    console.log('✅ Admin login SUCCESS!');
    console.log('   Token type:', loginData.token_type);
    console.log('   User email:', loginData.user?.email);
    console.log('   Role:', loginData.user?.role);
  } else {
    console.log(`❌ Admin login failed: ${JSON.stringify(loginData)}`);
  }

  // Test 3: Try sign in with user
  const login2 = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'user@jobook.com', password: 'User@2024' })
  });
  const loginData2 = await login2.json();
  console.log(login2.ok ? '✅ User login SUCCESS!' : `❌ User login failed: ${JSON.stringify(loginData2)}`);
}

test().catch(e => console.error('Error:', e.message));
