import mongoClient from './mongodb';

const mongoUri = import.meta.env.VITE_MONGODB_URI;

console.log('🍃 [JOBOOK] Using MongoDB Atlas Backend');

// MongoDB is the primary database
const supabase = mongoClient;

// Validation
if (!mongoUri) {
  console.error('⚠️  VITE_MONGODB_URI not configured in .env');
}

export { supabase };
