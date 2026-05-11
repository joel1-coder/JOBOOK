import { supabase } from '../lib/supabase';

export const userCreationService = {
  // Create user using Supabase Auth
  createUser: async (email, password, fullName, department, staffId) => {
    try {
      // Step 1: Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          department: department || 'General',
          staff_id: staffId,
        },
      });

      if (authError) {
        console.error('Auth creation error:', authError);
        return { error: authError };
      }

      // Step 2: Update profile with additional info
      if (authData?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            staff_id: staffId,
            full_name: fullName,
            department: department || 'General',
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          return { error: profileError };
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Unexpected error in createUser:', error);
      return { error: { message: error.message } };
    }
  },
};
