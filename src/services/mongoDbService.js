/**
 * MongoDB Service for JOBOOK
 * Provides business logic methods similar to supabaseService but using MongoDB
 */

import mongoService from './mongoService';

const API_BASE = 'http://localhost:5000/api/mongodb';

export const bookingServiceMongo = {
  async getAllBookings() {
    try {
      const response = await fetch(`${API_BASE}/bookings?sort=${JSON.stringify({ created_at: -1 })}`);
      const { data, error } = await response.json();
      if (error) return { data: null, error };

      // Populate related data
      const enriched = await Promise.all(data.map(async (booking) => {
        const room = booking.room_id ? 
          await mongoService.getById('rooms', booking.room_id) : 
          null;
        const slot = booking.slot_id ? 
          await mongoService.getById('time_slots', booking.slot_id) : 
          null;
        const profile = booking.user_id ? 
          await mongoService.getById('profiles', booking.user_id) : 
          null;

        return {
          ...booking,
          rooms: room?.data || null,
          time_slots: slot?.data || null,
          profiles: profile?.data || null
        };
      }));

      return { data: enriched, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async getBookingsByUser(userId) {
    try {
      const response = await fetch(
        `${API_BASE}/bookings?filter=${JSON.stringify({ user_id: userId })}`
      );
      const { data, error } = await response.json();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async getBookingsByStatus(status) {
    try {
      const response = await fetch(
        `${API_BASE}/bookings?filter=${JSON.stringify({ status })}`
      );
      const { data, error } = await response.json();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async createBooking(booking) {
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        })
      });
      const { data, error } = await response.json();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async updateBookingStatus(bookingId, newStatus) {
    try {
      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updated_at: new Date()
        })
      });
      const { data, error } = await response.json();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async deleteBooking(bookingId) {
    try {
      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      const { data, error } = await response.json();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};

export const roomServiceMongo = {
  async getAllRooms() {
    try {
      const { data, error } = await mongoService.getAll('rooms');
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async getRoomById(roomId) {
    try {
      const { data, error } = await mongoService.getById('rooms', roomId);
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async createRoom(room) {
    try {
      const { data, error } = await mongoService.create('rooms', {
        ...room,
        created_at: new Date()
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async updateRoom(roomId, updates) {
    try {
      const { data, error } = await mongoService.update('rooms', roomId, updates);
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};

export const timeSlotsServiceMongo = {
  async getAllSlots() {
    try {
      const { data, error } = await mongoService.getAll('time_slots');
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async getSlotById(slotId) {
    try {
      const { data, error } = await mongoService.getById('time_slots', slotId);
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async createSlot(slot) {
    try {
      const { data, error } = await mongoService.create('time_slots', {
        ...slot,
        created_at: new Date()
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};

export const profileServiceMongo = {
  async getProfile(userId) {
    try {
      const { data, error } = await mongoService.getById('profiles', userId);
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async updateProfile(userId, updates) {
    try {
      const { data, error } = await mongoService.update('profiles', userId, updates);
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async createProfile(profile) {
    try {
      const { data, error } = await mongoService.create('profiles', {
        ...profile,
        created_at: new Date()
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};

export const authServiceMongo = {
  async signUp(email, password) {
    // Auth is still handled by Supabase
    // This is just a placeholder for consistency
    return { data: null, error: 'Use Supabase for authentication' };
  },

  async signIn(email, password) {
    // Auth is still handled by Supabase
    return { data: null, error: 'Use Supabase for authentication' };
  }
};

export default {
  bookingService: bookingServiceMongo,
  roomService: roomServiceMongo,
  timeSlotsService: timeSlotsServiceMongo,
  profileService: profileServiceMongo,
  authService: authServiceMongo
};
