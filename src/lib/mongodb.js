/**
 * MongoDB Client for JOBOOK
 * Provides a Supabase-like interface but uses MongoDB as the backend
 * Authentication stored in localStorage for now
 */

const MONGODB_URI = import.meta.env.VITE_MONGODB_URI;
const DB_NAME = import.meta.env.VITE_MONGODB_DB || 'jobook';

// Initialize MongoDB connection
async function initializeConnection() {
  try {
    // Import MongoClient dynamically for server-side use
    if (typeof window === 'undefined') {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DB_NAME);
      console.log('✅ MongoDB connected');
      return db;
    } else {
      // For client-side, we'll use REST API or mock
      console.log('⚠️  Running in browser - use API endpoints for MongoDB');
      return null;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// QueryBuilder-like class for MongoDB operations
class MongoQueryBuilder {
  constructor(collection) {
    this.collection = collection;
    this.filters = {};
    this.sortBy = null;
    this.limitCount = null;
    this.selectFields = null;
  }

  eq(field, value) {
    this.filters[field] = value;
    return this;
  }

  in(field, values) {
    this.filters[field] = { $in: values };
    return this;
  }

  select(fields) {
    if (typeof fields === 'string') {
      this.selectFields = fields.split(',').reduce((acc, f) => {
        acc[f.trim()] = 1;
        return acc;
      }, {});
    }
    return this;
  }

  order(field, ascending = true) {
    this.sortBy = { [field]: ascending ? 1 : -1 };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const result = await this.collection
      .findOne(this.filters, { projection: this.selectFields });
    return { data: result, error: null };
  }

  async execute() {
    let query = this.collection.find(this.filters);

    if (this.selectFields) {
      query = query.project(this.selectFields);
    }

    if (this.sortBy) {
      query = query.sort(this.sortBy);
    }

    if (this.limitCount) {
      query = query.limit(this.limitCount);
    }

    const data = await query.toArray();
    return { data, error: null };
  }
}

// Main MongoDB Client Object (Supabase-like interface)
export const mongoClient = {
  async from(collectionName) {
    if (!db) {
      // For client-side, return a mock that delegates to API
      return {
        select: (fields) => ({
          eq: (field, value) => ({
            then: async (resolve) => {
              const response = await fetch(`/api/mongodb/${collectionName}?${field}=${value}&fields=${fields}`);
              const result = await response.json();
              resolve({ data: result, error: null });
            }
          }),
          execute: async () => {
            const response = await fetch(`/api/mongodb/${collectionName}?fields=${fields}`);
            const data = await response.json();
            return { data, error: null };
          }
        }),
        insert: (values) => ({
          then: async (resolve) => {
            const response = await fetch(`/api/mongodb/${collectionName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(values)
            });
            const result = await response.json();
            resolve({ data: result, error: null });
          }
        }),
        update: (values) => ({
          eq: (field, value) => ({
            then: async (resolve) => {
              const response = await fetch(`/api/mongodb/${collectionName}?${field}=${value}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
              });
              const result = await response.json();
              resolve({ data: result, error: null });
            }
          })
        }),
        delete: () => ({
          eq: (field, value) => ({
            then: async (resolve) => {
              const response = await fetch(`/api/mongodb/${collectionName}?${field}=${value}`, {
                method: 'DELETE'
              });
              const result = await response.json();
              resolve({ data: result, error: null });
            }
          })
        })
      };
    }

    // Server-side MongoDB operations
    const collection = db.collection(collectionName);

    return {
      select: (fields) => new MongoQueryBuilder(collection),
      insert: async (values) => {
        try {
          const result = await collection.insertOne(values);
          return { data: { ...values, _id: result.insertedId }, error: null };
        } catch (error) {
          return { data: null, error: error.message };
        }
      },
      update: (values) => ({
        eq: async (field, value) => {
          try {
            const result = await collection.updateOne(
              { [field]: value },
              { $set: values }
            );
            return { data: { ...values, [field]: value }, error: null };
          } catch (error) {
            return { data: null, error: error.message };
          }
        }
      }),
      delete: () => ({
        eq: async (field, value) => {
          try {
            await collection.deleteOne({ [field]: value });
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error: error.message };
          }
        }
      })
    };
  },

  auth: {
    async signInWithPassword({ email, password }) {
      // Simple localStorage-based authentication
      // In production, this would validate against MongoDB
      try {
        const users = JSON.parse(localStorage.getItem('jobook_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
        }
        
        const session = {
          user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
          access_token: `token_${user.id}`,
          expires_in: 3600
        };
        
        localStorage.setItem('jobook_auth_session', JSON.stringify(session));
        return { data: { user: session.user, session }, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    async signUp({ email, password, options = {} }) {
      try {
        const users = JSON.parse(localStorage.getItem('jobook_users') || '[]');
        
        if (users.find(u => u.email === email)) {
          return { data: null, error: { message: 'User already exists' } };
        }
        
        const newUser = {
          id: `user_${Date.now()}`,
          email,
          password, // In production, this should be hashed!
          user_metadata: options.data || {}
        };
        
        users.push(newUser);
        localStorage.setItem('jobook_users', JSON.stringify(users));
        
        return { data: { user: newUser }, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    async signOut() {
      localStorage.removeItem('jobook_auth_session');
      return { error: null };
    },

    async getSession() {
      const session = JSON.parse(localStorage.getItem('jobook_auth_session') || 'null');
      return { data: { session }, error: null };
    },

    onAuthStateChange(callback) {
      // Simple subscription mechanism
      const session = JSON.parse(localStorage.getItem('jobook_auth_session') || 'null');
      const event = session ? 'SIGNED_IN' : 'SIGNED_OUT';
      
      callback(event, session);
      
      // Return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },

    async resetPasswordForEmail(email, options = {}) {
      // Mock implementation
      return { data: null, error: null };
    },

    async updateUser(attributes) {
      try {
        const session = JSON.parse(localStorage.getItem('jobook_auth_session') || 'null');
        if (!session) {
          return { data: null, error: { message: 'Not authenticated' } };
        }
        
        const users = JSON.parse(localStorage.getItem('jobook_users') || '[]');
        const userIndex = users.findIndex(u => u.id === session.user.id);
        
        if (userIndex === -1) {
          return { data: null, error: { message: 'User not found' } };
        }
        
        users[userIndex] = { ...users[userIndex], ...attributes };
        localStorage.setItem('jobook_users', JSON.stringify(users));
        
        return { data: users[userIndex], error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    }
  }
};

export default mongoClient;
