// Mock Supabase Client for local testing without database connection
// Stores data in localStorage to persist across page reloads

const STORAGE_PREFIX = 'jobook_mock_';

// Help helper to read/write from local storage
const getStorageData = (key, defaultData = []) => {
  const value = localStorage.getItem(STORAGE_PREFIX + key);
  if (!value) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultData;
  }
};

const setStorageData = (key, data) => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
};

// Initial Seed Data
const defaultRooms = [
  {
    id: 'd9b97a2e-4bdf-4824-a78b-d5966a3d9061',
    name: 'VIDEO EDITING ROOM',
    capacity: 10,
    floor: 'MCA BLOCK',
    building: 'MCA BLOCK',
    type: 'Video Editing',
    description: 'Advanced video editing workstations and tools.',
    image_url: '/sjc-trichy.avif',
    emoji: '🎬',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'b5c00e12-421c-4b68-b769-90b4d45d8b7a',
    name: 'CONFERENCE HALL A',
    capacity: 50,
    floor: '1st Floor',
    building: 'Main Block',
    type: 'Conference',
    description: 'Spacious hall with projector and conference audio system.',
    image_url: '',
    emoji: '🏢',
    available: true,
    created_at: new Date().toISOString(),
  }
];

const defaultSlots = [
  {
    id: 's101',
    label: 'Morning Slot',
    start_time: '08:00',
    end_time: '10:00',
    days: 'Mon-Fri',
    rooms: 'All',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's102',
    label: 'Late Morning',
    start_time: '10:00',
    end_time: '12:00',
    days: 'Mon-Fri',
    rooms: 'All',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's103',
    label: 'Lunch Slot',
    start_time: '12:00',
    end_time: '14:00',
    days: 'Mon-Sat',
    rooms: 'Boardroom, Hub',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's104',
    label: 'Afternoon',
    start_time: '14:00',
    end_time: '16:00',
    days: 'Mon-Fri',
    rooms: 'All',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's105',
    label: 'Late Afternoon',
    start_time: '16:00',
    end_time: '18:00',
    days: 'Mon-Fri',
    rooms: 'All',
    active: false,
    created_at: new Date().toISOString(),
  }
];

const defaultRules = {
  id: 'r101',
  max_bookings_per_day: 3,
  max_bookings_per_week: 10,
  max_duration_hours: 4,
  min_notice_mins: 30,
  max_advance_days: 30,
  allow_weekends: false,
  require_approval: false,
  auto_cancel: true,
  auto_cancel_mins: 15,
  allow_guest_booking: false,
  max_capacity_percent: 100,
  updated_at: new Date().toISOString(),
};

// Seed initial values if not present
getStorageData('rooms', defaultRooms);
getStorageData('time_slots', defaultSlots);
getStorageData('booking_rules', [defaultRules]);
getStorageData('bookings', []);
getStorageData('notifications', []);

// Seed default users if empty
const defaultUsers = [
  {
    id: 'admin-uuid-1111-2222',
    email: 'admin@jobook.com',
    password: '123456', // Simulated password
    user_metadata: { full_name: 'System Admin' },
  },
  {
    id: 'user-uuid-3333-4444',
    email: 'user@jobook.com',
    password: '123456', // Simulated password
    user_metadata: { full_name: 'John Doe' },
  }
];
const seededAuthUsers = getStorageData('auth_users', defaultUsers);

const defaultProfiles = [
  {
    id: 'admin-uuid-1111-2222',
    staff_id: 'ADM-001',
    full_name: 'System Admin',
    email: 'admin@jobook.com',
    department: 'Administration',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-uuid-3333-4444',
    staff_id: 'STF-102',
    full_name: 'John Doe',
    email: 'user@jobook.com',
    department: 'Engineering',
    role: 'user',
    status: 'active',
    created_at: new Date().toISOString(),
  }
];
getStorageData('profiles', defaultProfiles);

// Auth Callbacks (onAuthStateChange subscription)
const authListeners = new Set();
let currentSession = null;

// Realtime Channel subscriptions mock
const mockChannels = new Set();

const broadcastChange = (tableName, eventType, newRow) => {
  mockChannels.forEach((channel) => {
    if (channel.listeners) {
      for (const listener of channel.listeners) {
        if (listener.eventType === 'postgres_changes' && listener.filter?.table === tableName) {
          let filterMatches = true;
          if (listener.filter?.filter) {
            const parts = listener.filter.filter.split('=eq.');
            if (parts.length === 2) {
              const col = parts[0];
              const val = parts[1];
              if (newRow[col] !== val) {
                filterMatches = false;
              }
            }
          }
          if (filterMatches) {
            listener.callback({ eventType, new: newRow });
          }
        }
      }
    }
  });
};

// Load initial session if one was active in localStorage
const savedSession = localStorage.getItem(STORAGE_PREFIX + 'session');
if (savedSession) {
  try {
    currentSession = JSON.parse(savedSession);
  } catch (_) {}
}

const triggerAuthStateChange = (event, session) => {
  currentSession = session;
  if (session) {
    localStorage.setItem(STORAGE_PREFIX + 'session', JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_PREFIX + 'session');
  }
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
};

// ─── Query Builder ───────────────────────────────────────────
class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orderBy = null;
    this.limitCount = null;
    this.isSingle = false;
    this.operation = 'select'; // 'select' | 'insert' | 'update' | 'delete'
    this.payload = null;
  }

  select(columns = '*') {
    this.operation = 'select';
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value, type: 'eq' });
    return this;
  }

  in(column, values) {
    this.filters.push({ column, values, type: 'in' });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderBy = { column, ascending };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async execute() {
    let data = getStorageData(this.tableName);
    let error = null;

    if (this.operation === 'select') {
      // Apply filters
      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          data = data.filter(item => item[filter.column] === filter.value);
        } else if (filter.type === 'in') {
          data = data.filter(item => filter.values.includes(item[filter.column]));
        }
      }

      // Apply order
      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        data.sort((a, b) => {
          let valA = a[column];
          let valB = b[column];
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this.limitCount !== null) {
        data = data.slice(0, this.limitCount);
      }

      // Resolve joins
      data = data.map(item => {
        const resolved = { ...item };
        if (this.tableName === 'bookings') {
          const rooms = getStorageData('rooms');
          const profiles = getStorageData('profiles');
          const slots = getStorageData('time_slots');

          resolved.rooms = rooms.find(r => r.id === item.room_id) || null;
          resolved.profiles = profiles.find(p => p.id === item.user_id) || null;
          resolved.time_slots = slots.find(s => s.id === item.slot_id) || null;
        }
        return resolved;
      });

      if (this.isSingle) {
        if (data.length === 0) {
          error = { message: 'Row not found' };
          data = null;
        } else {
          data = data[0];
        }
      }
    } else if (this.operation === 'insert') {
      const isArray = Array.isArray(this.payload);
      const itemsToInsert = isArray ? this.payload : [this.payload];
      const insertedItems = [];

      for (const item of itemsToInsert) {
        const newItem = {
          id: item.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item
        };

        if (this.tableName === 'bookings' && !newItem.booking_ref) {
          const bookings = getStorageData('bookings');
          const nextVal = 200 + bookings.length;
          newItem.booking_ref = `BK-${String(nextVal).padStart(4, '0')}`;
          newItem.status = newItem.status || 'pending';
        }

        data.push(newItem);
        insertedItems.push(newItem);
        broadcastChange(this.tableName, 'INSERT', newItem);
      }

      setStorageData(this.tableName, data);
      data = this.isSingle || !isArray ? insertedItems[0] : insertedItems;
    } else if (this.operation === 'update') {
      let affectedRows = [];
      const updatedData = data.map(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (item[filter.column] !== filter.value) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const updatedItem = {
            ...item,
            ...this.payload,
            updated_at: new Date().toISOString()
          };
          affectedRows.push(updatedItem);
          broadcastChange(this.tableName, 'UPDATE', updatedItem);
          return updatedItem;
        }
        return item;
      });

      setStorageData(this.tableName, updatedData);

      // Trigger automatic booking notifications on status updates
      if (this.tableName === 'bookings' && this.payload.status) {
        const status = this.payload.status;
        if (['confirmed', 'cancelled'].includes(status)) {
          for (const booking of affectedRows) {
            const notifications = getStorageData('notifications');
            const newNotif = {
              id: crypto.randomUUID(),
              user_id: booking.user_id,
              type: status === 'confirmed' ? 'booking_approved' : 'booking_rejected',
              title: status === 'confirmed' ? 'Booking Approved' : 'Booking Cancelled',
              message: `Your booking ${booking.booking_ref || ''} has been ${status === 'confirmed' ? 'approved' : 'cancelled'}.`,
              is_read: false,
              created_at: new Date().toISOString()
            };
            notifications.push(newNotif);
            setStorageData('notifications', notifications);
            broadcastChange('notifications', 'INSERT', newNotif);
          }
        }
      }

      if (this.isSingle) {
        data = affectedRows[0] || null;
      } else {
        data = affectedRows;
      }
    } else if (this.operation === 'delete') {
      let remainingRows = [];
      let deletedRows = [];
      for (const item of data) {
        let matches = true;
        for (const filter of this.filters) {
          if (item[filter.column] !== filter.value) {
            matches = false;
            break;
          }
        }
        if (matches) {
          deletedRows.push(item);
        } else {
          remainingRows.push(item);
        }
      }
      setStorageData(this.tableName, remainingRows);
      data = deletedRows;
    }

    return { data, error };
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

// ─── Main Mock Supabase Object ────────────────────────────────
export const mockSupabase = {
  auth: {
    signUp: async ({ email, password, options = {} }) => {
      const users = getStorageData('auth_users');
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { data: null, error: { message: 'User already exists' } };
      }

      const userId = crypto.randomUUID();
      const newUser = {
        id: userId,
        email,
        password,
        user_metadata: options.data || {},
      };
      users.push(newUser);
      setStorageData('auth_users', users);

      // Simulate pg trigger that syncs auth.users -> profiles table
      const profiles = getStorageData('profiles');
      const newProfile = {
        id: userId,
        staff_id: options.data?.staff_id || `STF-${Math.floor(100 + Math.random() * 900)}`,
        full_name: options.data?.full_name || email.split('@')[0],
        email,
        department: options.data?.department || 'General',
        role: 'user', // Default is user
        status: 'active',
        created_at: new Date().toISOString(),
      };
      profiles.push(newProfile);
      setStorageData('profiles', profiles);

      const session = {
        access_token: 'mock-access-token-' + userId,
        user: {
          id: userId,
          email,
          user_metadata: options.data || {},
        }
      };

      triggerAuthStateChange('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const users = getStorageData('auth_users');
      const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
      }

      const session = {
        access_token: 'mock-access-token-' + user.id,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        }
      };

      triggerAuthStateChange('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },

    signOut: async () => {
      triggerAuthStateChange('SIGNED_OUT', null);
      return { error: null };
    },

    getSession: async () => {
      return { data: { session: currentSession }, error: null };
    },

    onAuthStateChange: (callback) => {
      authListeners.add(callback);
      // Immediately call with current state
      try {
        callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);
      } catch (_) {}
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            }
          }
        }
      };
    },

    resetPasswordForEmail: async (email, options = {}) => {
      const users = getStorageData('auth_users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return { data: null, error: { message: 'Email not found' } };
      }
      return { data: {}, error: null };
    },

    updateUser: async ({ password }) => {
      if (!currentSession?.user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }
      const users = getStorageData('auth_users');
      const index = users.findIndex(u => u.id === currentSession.user.id);
      if (index !== -1) {
        users[index].password = password;
        setStorageData('auth_users', users);
      }
      return { data: { user: currentSession.user }, error: null };
    },

    admin: {
      createUser: async (options) => {
        const { email, password, user_metadata = {} } = options;
        const users = getStorageData('auth_users');
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { data: null, error: { message: 'User already exists' } };
        }

        const userId = crypto.randomUUID();
        const newUser = {
          id: userId,
          email,
          password,
          user_metadata,
        };
        users.push(newUser);
        setStorageData('auth_users', users);

        const profiles = getStorageData('profiles');
        const newProfile = {
          id: userId,
          staff_id: user_metadata.staff_id || `STF-${Math.floor(100 + Math.random() * 900)}`,
          full_name: user_metadata.full_name || email.split('@')[0],
          email,
          department: user_metadata.department || 'General',
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        profiles.push(newProfile);
        setStorageData('profiles', profiles);

        return { data: { user: { id: userId, email, user_metadata } }, error: null };
      }
    }
  },

  from: (tableName) => {
    return new MockQueryBuilder(tableName);
  },

  channel: (channelName) => {
    const channelInstance = {
      on: (eventType, filter, callback) => {
        if (!channelInstance.listeners) {
          channelInstance.listeners = [];
        }
        channelInstance.listeners.push({ eventType, filter, callback });
        return channelInstance;
      },
      subscribe: () => {
        mockChannels.add(channelInstance);
        return channelInstance;
      }
    };
    return channelInstance;
  },

  removeChannel: (channelInstance) => {
    mockChannels.delete(channelInstance);
  },

  rpc: async (functionName, args = {}) => {
    if (functionName === 'admin_delete_user') {
      const targetUserId = args.target_user_id;
      if (!targetUserId) return { error: { message: 'Target user ID is required' } };

      const users = getStorageData('auth_users');
      const filteredUsers = users.filter(u => u.id !== targetUserId);
      setStorageData('auth_users', filteredUsers);

      const profiles = getStorageData('profiles');
      const filteredProfiles = profiles.filter(p => p.id !== targetUserId);
      setStorageData('profiles', filteredProfiles);

      const bookings = getStorageData('bookings');
      const filteredBookings = bookings.filter(b => b.user_id !== targetUserId);
      setStorageData('bookings', filteredBookings);

      return { data: true, error: null };
    }
    return { data: null, error: { message: `RPC function '${functionName}' not implemented in mock client.` } };
  }
};

// ─── Intercept Fetch Calls for Supabase Edge Functions ─────────
const originalFetch = window.fetch;
window.fetch = async function (url, options) {
  if (typeof url === 'string' && url.includes('/functions/v1/create-user')) {
    try {
      const body = JSON.parse(options.body);
      const { email, password, full_name, department, staff_id } = body;

      const { data, error } = await mockSupabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name,
          department,
          staff_id
        }
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  return originalFetch.apply(this, arguments);
};
