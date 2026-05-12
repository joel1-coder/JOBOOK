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

  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  updatePassword: async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
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

  adminCreateUser: async (email, password, fullName, department, staffId) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            department: department || 'General',
            staff_id: staffId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Edge Function error:', data);
        return { data: null, error: { message: data.error || 'Failed to create user' } };
      }

      console.log('User created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error calling create-user function:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  adminDeleteUser: async (userId) => {
    const { error } = await supabase.rpc('admin_delete_user', {
      target_user_id: userId
    });
    return { error };
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

  getAllRooms: async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name');
    return { data, error };
  },

  createRoom: async (roomData) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();
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

  deleteRoom: async (id) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// ─── Bookings ────────────────────────────────────────────────
export const bookingService = {
  getUserBookings: async (userId) => {
    const withImages = await supabase
      .from('bookings')
      .select(`*, rooms(name, emoji, image_url), time_slots(label, start_time, end_time)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!withImages.error) return withImages;

    const { data, error } = await supabase
      .from('bookings')
      .select(`*, rooms(name, emoji), time_slots(label, start_time, end_time)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAllBookings: async () => {
    const withImages = await supabase
      .from('bookings')
      .select(`*, rooms(name, emoji, image_url), profiles(full_name, email), time_slots(label, start_time, end_time)`)
      .order('created_at', { ascending: false });
    if (!withImages.error) return withImages;

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
    if (!error && data?.user_id && ['confirmed', 'cancelled'].includes(status)) {
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        type: status === 'confirmed' ? 'booking_approved' : 'booking_rejected',
        title: status === 'confirmed' ? 'Booking approved' : 'Booking rejected',
        message: `Your booking ${data.booking_ref || ''} has been ${status === 'confirmed' ? 'approved' : 'rejected'}.`,
      });
    }
    return { data, error };
  },

  deleteBooking: async (id) => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    return { error };
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

// ─── Notifications ───────────────────────────────────────────
export const notificationService = {
  getNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    return { data, error };
  },

  markAsRead: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    return { error };
  },

  markAllAsRead: async (userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    return { error };
  },
};
