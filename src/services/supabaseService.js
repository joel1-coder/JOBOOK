import { supabase } from '../lib/supabase';

// ─── Auth ────────────────────────────────────────────────────
export const authService = {
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ─── Profile ─────────────────────────────────────────────────
export const profileService = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateUserRole: async (userId, role) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  updateUserStatus: async (userId, status) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// ─── Rooms ───────────────────────────────────────────────────
export const roomService = {
  getRooms: async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name');
    return { data, error };
  },

  updateRoom: async (id, updates) => {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// ─── Bookings ────────────────────────────────────────────────
export const bookingService = {
  getUserBookings: async (userId) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, rooms(name, emoji), time_slots(label, start_time, end_time)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAllBookings: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, rooms(name, emoji), profiles(full_name, email), time_slots(label, start_time, end_time)`)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createBooking: async ({ userId, roomId, slotId, date, notes }) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert({ user_id: userId, room_id: roomId, slot_id: slotId, date, notes })
      .select()
      .single();
    return { data, error };
  },

  updateBookingStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// ─── Time Slots ──────────────────────────────────────────────
export const slotService = {
  getSlots: async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('start_time');
    return { data, error };
  },

  createSlot: async (slot) => {
    const { data, error } = await supabase
      .from('time_slots')
      .insert(slot)
      .select()
      .single();
    return { data, error };
  },

  updateSlot: async (id, updates) => {
    const { data, error } = await supabase
      .from('time_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deleteSlot: async (id) => {
    const { error } = await supabase.from('time_slots').delete().eq('id', id);
    return { error };
  },
};

// ─── Booking Rules ───────────────────────────────────────────
export const rulesService = {
  getRules: async () => {
    const { data, error } = await supabase
      .from('booking_rules')
      .select('*')
      .limit(1)
      .single();
    return { data, error };
  },

  updateRules: async (id, updates) => {
    const { data, error } = await supabase
      .from('booking_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};
