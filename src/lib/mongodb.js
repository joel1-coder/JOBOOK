/**
 * MongoDB client for JOBOOK.
 * Exposes the small Supabase-like surface the app uses while delegating
 * browser data access to the local MongoDB REST API.
 */

const API_BASE = import.meta.env.VITE_MONGODB_API_BASE || 'http://localhost:5000/api/mongodb';

function nowIso() {
  return new Date().toISOString();
}

function toProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: user.role || user.user_metadata?.role || 'user',
    department: user.department || 'General',
    staff_id: user.staff_id || '',
    status: user.status || 'active',
    created_at: user.created_at || nowIso(),
    updated_at: user.updated_at || nowIso(),
  };
}

function getStoredUsers() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('jobook_users') || '[]');
}

function setStoredUsers(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('jobook_users', JSON.stringify(users));
}

function initializeDefaultUsers() {
  if (typeof window === 'undefined') return;

  const existingUsers = localStorage.getItem('jobook_users');
  if (existingUsers) return;

  const createdAt = nowIso();
  const defaultUsers = [
    {
      id: 'admin-uuid-1111-2222',
      email: 'admin@jobook.com',
      password: '123456',
      full_name: 'System Admin',
      role: 'admin',
      department: 'Administration',
      staff_id: 'ADMIN001',
      status: 'active',
      created_at: createdAt,
      updated_at: createdAt,
      user_metadata: { role: 'admin', full_name: 'System Admin' },
    },
    {
      id: 'user-uuid-3333-4444',
      email: 'user@jobook.com',
      password: '123456',
      full_name: 'John Doe',
      role: 'user',
      department: 'General',
      staff_id: 'USER001',
      status: 'active',
      created_at: createdAt,
      updated_at: createdAt,
      user_metadata: { role: 'user', full_name: 'John Doe' },
    },
  ];

  setStoredUsers(defaultUsers);
  console.log('[JOBOOK] Default users initialized in localStorage');
}

function normalizeDoc(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const normalized = { ...doc };
  if (normalized._id && !normalized.id) {
    normalized.id = String(normalized._id);
  }
  return normalized;
}

function normalizeResult(value) {
  if (Array.isArray(value)) return value.map(normalizeDoc);
  return normalizeDoc(value);
}

function matchesFilters(doc, filters) {
  return Object.entries(filters).every(([field, expected]) => {
    if (expected && typeof expected === 'object' && '$in' in expected) {
      return expected.$in.includes(doc[field]);
    }
    return doc[field] === expected;
  });
}

function localProfiles(filters = {}) {
  return getStoredUsers()
    .map(toProfile)
    .filter((profile) => matchesFilters(profile, filters));
}

function errorResult(error) {
  return {
    data: null,
    error: { message: error?.message || String(error) },
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: null,
      error: {
        message: payload?.error?.message || payload?.error || payload?.message || response.statusText,
      },
    };
  }

  return payload;
}

async function fetchCollection(collectionName, filters = {}, sortBy = null, limitCount = null) {
  const params = new URLSearchParams();
  if (Object.keys(filters).length) params.set('filter', JSON.stringify(filters));
  if (sortBy) params.set('sort', JSON.stringify(sortBy));
  if (limitCount) params.set('limit', String(limitCount));

  const query = params.toString();
  const url = `${API_BASE}/${collectionName}${query ? `?${query}` : ''}`;
  const result = await fetchJson(url);
  return {
    data: normalizeResult(result.data || []),
    error: result.error,
  };
}

async function fetchById(collectionName, id) {
  if (!id) return { data: null, error: null };

  if (collectionName === 'profiles') {
    const profile = localProfiles({ id })[0];
    if (profile) return { data: profile, error: null };
  }

  const byRoute = await fetchJson(`${API_BASE}/${collectionName}/${encodeURIComponent(id)}`);
  if (byRoute.data) {
    return { data: normalizeDoc(byRoute.data), error: null };
  }

  const byIdField = await fetchCollection(collectionName, { id }, null, 1);
  return {
    data: byIdField.data?.[0] || null,
    error: byIdField.error,
  };
}

async function enrichBookingRelations(bookings, selectFields) {
  if (!Array.isArray(bookings) || !selectFields) return bookings;

  const includeRooms = selectFields.includes('rooms(');
  const includeSlots = selectFields.includes('time_slots(');
  const includeProfiles = selectFields.includes('profiles(');
  if (!includeRooms && !includeSlots && !includeProfiles) return bookings;

  return Promise.all(bookings.map(async (booking) => {
    const enriched = { ...booking };

    if (includeRooms && booking.room_id) {
      const { data } = await fetchById('rooms', booking.room_id);
      enriched.rooms = data;
    }

    if (includeSlots && booking.slot_id) {
      const { data } = await fetchById('time_slots', booking.slot_id);
      enriched.time_slots = data;
    }

    if (includeProfiles && booking.user_id) {
      const { data } = await fetchById('profiles', booking.user_id);
      enriched.profiles = data;
    }

    return enriched;
  }));
}

class MongoRestQueryBuilder {
  constructor(collectionName, operation = 'select', payload = null) {
    this.collectionName = collectionName;
    this.operation = operation;
    this.payload = payload;
    this.filters = {};
    this.sortBy = null;
    this.limitCount = null;
    this.selectedFields = '*';
    this.returnRows = operation === 'select';
    this.singleResult = false;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    this.returnRows = true;
    return this;
  }

  eq(field, value) {
    this.filters[field] = value;
    return this;
  }

  in(field, values) {
    this.filters[field] = { $in: values };
    return this;
  }

  order(field, options = {}) {
    const ascending = typeof options === 'object' ? options.ascending !== false : options !== false;
    this.sortBy = { [field]: ascending ? 1 : -1 };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async single() {
    this.singleResult = true;
    return this.execute();
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  finally(callback) {
    return this.execute().finally(callback);
  }

  async execute() {
    try {
      if (this.operation === 'insert') return await this.executeInsert();
      if (this.operation === 'update') return await this.executeUpdate();
      if (this.operation === 'delete') return await this.executeDelete();
      return await this.executeSelect();
    } catch (error) {
      return errorResult(error);
    }
  }

  async executeSelect() {
    const result = await fetchCollection(this.collectionName, this.filters, this.sortBy, this.limitCount);
    if (result.error) return result;

    let data = result.data || [];

    if (this.collectionName === 'profiles') {
      const merged = new Map();
      [...localProfiles(this.filters), ...data].forEach((profile) => {
        if (profile?.id) merged.set(profile.id, normalizeDoc(profile));
      });
      data = Array.from(merged.values());
    }

    if (this.sortBy) {
      const [field, direction] = Object.entries(this.sortBy)[0];
      data = [...data].sort((a, b) => {
        if (a[field] === b[field]) return 0;
        return a[field] > b[field] ? direction : -direction;
      });
    }

    if (this.limitCount) data = data.slice(0, this.limitCount);
    data = await enrichBookingRelations(data, this.selectedFields);

    if (this.singleResult) {
      return { data: data[0] || null, error: null };
    }

    return { data, error: null };
  }

  async executeInsert() {
    const documents = Array.isArray(this.payload) ? this.payload : [this.payload];
    const inserted = [];

    for (const document of documents) {
      const body = {
        ...document,
        created_at: document?.created_at || nowIso(),
        updated_at: document?.updated_at || nowIso(),
      };
      const result = await fetchJson(`${API_BASE}/${this.collectionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (result.error) return result;
      inserted.push(normalizeDoc(result.data));
    }

    const data = this.singleResult ? inserted[0] || null : (Array.isArray(this.payload) ? inserted : inserted[0] || null);
    return { data, error: null };
  }

  async executeUpdate() {
    const targets = await this.resolveMutationTargets();
    if (targets.error) return targets;

    const updated = [];
    for (const target of targets.data) {
      const id = target.id || target._id;
      const result = await fetchJson(`${API_BASE}/${this.collectionName}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.payload, updated_at: nowIso() }),
      });
      if (result.error && this.collectionName === 'profiles') {
        const profile = localProfiles({ id })[0];
        if (profile) {
          updated.push({ ...profile, ...this.payload, updated_at: nowIso() });
          continue;
        }
      }
      if (result.error) return result;
      updated.push(normalizeDoc(result.data));
    }

    if (this.collectionName === 'profiles') {
      this.updateLocalProfiles(updated);
    }

    return {
      data: this.singleResult ? updated[0] || null : updated,
      error: null,
    };
  }

  async executeDelete() {
    const targets = await this.resolveMutationTargets();
    if (targets.error) return targets;

    for (const target of targets.data) {
      const id = target.id || target._id;
      const result = await fetchJson(`${API_BASE}/${this.collectionName}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (result.error) return result;
    }

    return { data: null, error: null };
  }

  async resolveMutationTargets() {
    if (this.filters.id) {
      return { data: [{ id: this.filters.id }], error: null };
    }

    if (this.filters._id) {
      return { data: [{ id: this.filters._id }], error: null };
    }

    const result = await fetchCollection(this.collectionName, this.filters);
    return { data: result.data || [], error: result.error };
  }

  updateLocalProfiles(updatedProfiles) {
    const users = getStoredUsers();
    const updatedById = new Map(updatedProfiles.map((profile) => [profile.id, profile]));
    const nextUsers = users.map((user) => {
      const profile = updatedById.get(user.id);
      if (!profile) return user;

      return {
        ...user,
        ...profile,
        password: user.password,
        user_metadata: {
          ...user.user_metadata,
          role: profile.role || user.role,
          full_name: profile.full_name || user.full_name,
        },
      };
    });

    setStoredUsers(nextUsers);
  }
}

export const mongoClient = {
  from(collectionName) {
    return {
      select: (fields = '*') => new MongoRestQueryBuilder(collectionName).select(fields),
      insert: (values) => new MongoRestQueryBuilder(collectionName, 'insert', values),
      update: (values) => new MongoRestQueryBuilder(collectionName, 'update', values),
      delete: () => new MongoRestQueryBuilder(collectionName, 'delete'),
    };
  },

  auth: {
    async signInWithPassword({ email, password }) {
      try {
        const users = getStoredUsers();
        const user = users.find((candidate) => candidate.email === email && candidate.password === password);

        if (!user) {
          return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
        }

        const profile = toProfile(user);
        const session = {
          user: {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            user_metadata: {
              role: profile.role,
              full_name: profile.full_name,
            },
          },
          access_token: `token_${profile.id}`,
          expires_in: 3600,
        };

        localStorage.setItem('jobook_auth_session', JSON.stringify(session));
        return { data: { user: session.user, session }, error: null };
      } catch (error) {
        return errorResult(error);
      }
    },

    async signUp({ email, password, options = {} }) {
      try {
        const users = getStoredUsers();
        if (users.find((user) => user.email === email)) {
          return { data: null, error: { message: 'User already exists' } };
        }

        const fullName = options.data?.full_name || email.split('@')[0];
        const newUser = {
          id: `user_${Date.now()}`,
          email,
          password,
          full_name: fullName,
          role: 'user',
          department: 'General',
          status: 'active',
          created_at: nowIso(),
          updated_at: nowIso(),
          user_metadata: { ...(options.data || {}), role: 'user', full_name: fullName },
        };

        users.push(newUser);
        setStoredUsers(users);

        return { data: { user: newUser }, error: null };
      } catch (error) {
        return errorResult(error);
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
      const session = JSON.parse(localStorage.getItem('jobook_auth_session') || 'null');
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },

    async resetPasswordForEmail() {
      return { data: null, error: null };
    },

    async updateUser(attributes) {
      try {
        const session = JSON.parse(localStorage.getItem('jobook_auth_session') || 'null');
        if (!session) {
          return { data: null, error: { message: 'Not authenticated' } };
        }

        const users = getStoredUsers();
        const userIndex = users.findIndex((user) => user.id === session.user.id);
        if (userIndex === -1) {
          return { data: null, error: { message: 'User not found' } };
        }

        users[userIndex] = {
          ...users[userIndex],
          ...attributes,
          updated_at: nowIso(),
        };
        setStoredUsers(users);

        return { data: users[userIndex], error: null };
      } catch (error) {
        return errorResult(error);
      }
    },
  },
};

initializeDefaultUsers();

export default mongoClient;
