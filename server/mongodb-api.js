/**
 * JOBOOK Hybrid MongoDB/Mock Backend Server
 * Handles MongoDB operations via REST API with fallback to in-memory storage
 */

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.MONGO_API_PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'jobook';

let db = null;
let useMockData = false;
let mockDb = {};

function mongoIdFilter(id) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
}

// Middleware
app.use(cors());
app.use(express.json());

// ===== MOCK DATA STORAGE =====
const mockDataFile = path.join(__dirname, 'mock-data.json');

function loadMockData() {
  try {
    if (fs.existsSync(mockDataFile)) {
      const data = fs.readFileSync(mockDataFile, 'utf-8');
      const parsed = JSON.parse(data);
      // Convert string IDs back to ObjectId-like objects
      return parsed;
    }
  } catch (error) {
    console.warn('⚠️  Could not load mock data file');
  }

  // Default mock data
  return {
    rooms: [
      {
        _id: new ObjectId().toString(),
        name: 'VIDEO EDITING ROOM',
        capacity: 10,
        floor: 'MCA BLOCK',
        building: 'MCA BLOCK',
        type: 'Video Editing',
        emoji: '🎬',
        available: true
      },
      {
        _id: new ObjectId().toString(),
        name: 'SERVER ROOM',
        capacity: 5,
        floor: 'IT BLOCK',
        building: 'IT BLOCK',
        type: 'Server',
        emoji: '🖥️',
        available: true
      }
    ],
    bookings: [],
    time_slots: [
      {
        _id: new ObjectId().toString(),
        start_time: '09:00',
        end_time: '10:00',
        day: 'Monday',
        available: true
      },
      {
        _id: new ObjectId().toString(),
        start_time: '10:00',
        end_time: '11:00',
        day: 'Monday',
        available: true
      }
    ],
    profiles: [],
    booking_rules: []
  };
}

function saveMockData() {
  try {
    fs.writeFileSync(mockDataFile, JSON.stringify(mockDb, null, 2), 'utf-8');
  } catch (error) {
    console.error('⚠️  Could not save mock data:', error.message);
  }
}

// Connect to MongoDB with fallback
async function connectDB() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('📍 Connection String:', MONGODB_URI?.substring(0, 50) + '...');

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true
    });

    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ MongoDB connected successfully!');
    useMockData = false;

    // Initialize collections
    await initializeCollections();
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.log('\n🔄 Falling back to mock data mode...');
    console.log('📝 Mock data will be stored in server/mock-data.json');
    console.log('\n💡 To use real MongoDB:');
    console.log('   1. Go to https://cloud.mongodb.com/');
    console.log('   2. Find Security → Network Access');
    console.log('   3. Add your IP address to whitelist');
    console.log('   4. Check connection string in .env\n');

    useMockData = true;
    mockDb = loadMockData();
  }
}

async function initializeCollections() {
  if (useMockData) {
    console.log('✅ Collections initialized (mock mode)');
    return;
  }

  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const requiredCollections = ['rooms', 'bookings', 'time_slots', 'profiles', 'booking_rules'];

    for (const collName of requiredCollections) {
      if (!collectionNames.includes(collName)) {
        await db.createCollection(collName);
        console.log(`✅ Created ${collName} collection`);
      }
    }
  } catch (error) {
    console.error('⚠️  Error initializing collections:', error.message);
  }
}

// ===== HELPER FUNCTIONS FOR MOCK DATA =====
function getCollection(name) {
  if (useMockData) {
    if (!mockDb[name]) mockDb[name] = [];
    return mockDb[name];
  }
  return db.collection(name);
}

// ===== API ENDPOINTS =====

// Get all documents from collection
app.get('/api/mongodb/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { filter, sort, limit } = req.query;

    if (useMockData) {
      let data = getCollection(collection) || [];

      if (filter) {
        const filterObj = JSON.parse(filter);
        data = data.filter(doc => {
          return Object.entries(filterObj).every(([key, value]) => {
            if (value && value.$in) {
              return value.$in.includes(doc[key]);
            }
            return doc[key] === value;
          });
        });
      }

      if (sort) {
        const sortObj = JSON.parse(sort);
        const sortKey = Object.keys(sortObj)[0];
        const sortOrder = sortObj[sortKey];
        data.sort((a, b) => {
          const aVal = a[sortKey];
          const bVal = b[sortKey];
          if (sortOrder === 1) return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }

      if (limit) {
        data = data.slice(0, parseInt(limit));
      }

      return res.json({ data, error: null });
    }

    let query = db.collection(collection).find({});

    if (filter) {
      query = db.collection(collection).find(JSON.parse(filter));
    }

    if (sort) {
      query = query.sort(JSON.parse(sort));
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const data = await query.toArray();
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Get single document
app.get('/api/mongodb/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;

    if (useMockData) {
      const data = getCollection(collection).find(doc => doc._id === id || doc.id === id);
      return res.json({ data, error: null });
    }

    const doc = await db.collection(collection).findOne(mongoIdFilter(id));
    res.json({ data: doc, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Insert document
app.post('/api/mongodb/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const document = req.body;

    if (useMockData) {
      const newDoc = {
        ...document,
        _id: new ObjectId().toString()
      };
      getCollection(collection).push(newDoc);
      saveMockData();
      return res.json({ data: newDoc, error: null });
    }

    const result = await db.collection(collection).insertOne(document);
    res.json({
      data: { ...document, _id: result.insertedId },
      error: null
    });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Update document
app.patch('/api/mongodb/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const updates = req.body;

    if (useMockData) {
      const coll = getCollection(collection);
      const index = coll.findIndex(doc => doc._id === id || doc.id === id);
      if (index === -1) {
        return res.status(404).json({ data: null, error: 'Document not found' });
      }
      const updated = { ...coll[index], ...updates, _id: coll[index]._id };
      coll[index] = updated;
      saveMockData();
      return res.json({ data: updated, error: null });
    }

    const result = await db.collection(collection).findOneAndUpdate(
      mongoIdFilter(id),
      { $set: updates },
      { returnDocument: 'after' }
    );

    res.json({ data: result?.value ?? result, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Delete document
app.delete('/api/mongodb/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;

    if (useMockData) {
      const coll = getCollection(collection);
      const index = coll.findIndex(doc => doc._id === id || doc.id === id);
      if (index === -1) {
        return res.status(404).json({ data: null, error: 'Document not found' });
      }
      coll.splice(index, 1);
      saveMockData();
      return res.json({ data: null, error: null });
    }

    await db.collection(collection).deleteOne(mongoIdFilter(id));

    res.json({ data: null, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: useMockData ? 'mock' : 'mongodb',
    connected: db ? true : useMockData
  });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 JOBOOK API server running on http://localhost:${PORT}`);
    console.log(`📊 Database Mode: ${useMockData ? 'MOCK (in-memory)' : 'MONGODB (Atlas)'}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  });
});
