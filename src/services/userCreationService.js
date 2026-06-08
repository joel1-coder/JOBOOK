import { authService } from './supabaseService';

export const userCreationService = {
  // Create user using MongoDB API via supabaseService
  createUser: async (email, password, fullName, department, staffId) => {
    try {
      // Use authService.adminCreateUser which now uses MongoDB API
      const { data: newUser, error } = await authService.adminCreateUser(
        email,
        password,
        fullName,
        department,
        staffId
      );

      if (error) {
        console.error('User creation error:', error);
        return { error };
      }

      return { data: newUser, error: null };
    } catch (error) {
      console.error('Unexpected error in createUser:', error);
      return { error: { message: error.message } };
    }
  },
};
